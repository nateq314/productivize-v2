import * as fbAdmin from "firebase-admin";
import { ForbiddenError } from "apollo-server-express";
import * as express from "express";
import { Context } from "../apolloServer";
import {
  getUserRecord,
  verifyIdToken,
  createUserSessionToken,
  verifyUserSessionToken
} from "../firebase";
import { ListGQL, ListDB, TodoDB, TodoGQL } from "../schema";
import { pubsub, LIST_EVENTS } from "./Subscription";

interface ILogin {
  idToken?: string;
  session?: string;
}

type TodoDateFields = "added_on" | "completed_on" | "deadline" | "remind_on";

function convertDateFieldsForPublishing(
  todo: TodoDB & { id: string; list_id: string }
) {
  const converted: any = { ...todo };
  (["added_on", "completed_on", "deadline", "remind_on"] as Array<
    TodoDateFields
  >).forEach((field) => {
    const value = todo[field];
    if (value) {
      converted[field] =
        value instanceof Date
          ? value.toISOString()
          : value.toDate().toISOString();
    }
  });
  return converted as TodoGQL;
}

const firestore = fbAdmin.firestore();
const listsCollRef = firestore.collection("lists");

export default {
  /**********************
   * CREATE A LIST
   *********************/
  async createList(parent: any, args: any, ctx: Context, info: any) {
    authorize(ctx);
    try {
      const current_uid = (ctx.user as fbAdmin.auth.DecodedIdToken).uid;
      // ====== BEGIN TRANSACTION =============================================
      const listCreated = await firestore.runTransaction(async (tx) => {
        const currUserLists = await tx.get(
          listsCollRef.where("owners", "array-contains", current_uid)
        );
        const newListDocRef = listsCollRef.doc();
        const newListData: ListDB = {
          name: args.name,
          order: currUserLists.size + 1,
          owners: [current_uid]
        };
        tx.create(newListDocRef, newListData);
        (newListData as ListGQL).id = newListDocRef.id;
        (newListData as ListGQL).todos = [];
        return newListData as ListGQL;
      });
      // ====== END TRANSACTION ===============================================
      pubsub.publish(LIST_EVENTS, { listCreated, owners: listCreated.owners });
      return listCreated;
    } catch (error) {
      console.error(error);
      return { error: error.message };
    }
  },

  /**********************
   * DELETE A LIST
   *********************/
  async deleteList(parent: any, args: any, ctx: Context, info: any) {
    authorize(ctx);
    try {
      const current_uid = (ctx.user as fbAdmin.auth.DecodedIdToken).uid;
      const todoListDocRef = listsCollRef.doc(args.id);
      // ====== BEGIN TRANSACTION =============================================
      const listDeleted = await firestore.runTransaction(async (tx) => {
        const deletedListData = (await tx.get(todoListDocRef)).data() as ListDB;
        if (!deletedListData.owners.includes(current_uid)) {
          // TODO: test this
          throw new ForbiddenError(
            "You are not authorized to touch this list."
          );
        }
        const higherOrderLists = await tx.get(
          listsCollRef.where("order", ">", deletedListData.order)
        );
        // First delete all the todos in the "todos" subcollection, if any.
        const todos = await todoListDocRef.collection("todos").listDocuments();
        todos.forEach((todo) => {
          tx.delete(todo);
        });
        // Then delete the list itself.
        tx.delete(todoListDocRef);
        higherOrderLists.forEach((list) => {
          const order = (list.data() as ListDB).order;
          tx.update(list.ref, { order: order - 1 });
        });
        (deletedListData as ListGQL).id = todoListDocRef.id;
        return deletedListData as ListGQL;
      });
      // ====== END TRANSACTION ===============================================
      pubsub.publish(LIST_EVENTS, { listDeleted, owners: listDeleted.owners });
      return { success: true };
    } catch (error) {
      console.error(error);
      return { error: error.message };
    }
  },

  /**********************
   * UPDATE A LIST
   *********************/
  async updateList(parent: any, args: any, ctx: Context, info: any) {
    authorize(ctx);
    let owners: string[] = [];
    let metadata = null;
    try {
      // ====== BEGIN TRANSACTION =============================================
      const listUpdated = await firestore.runTransaction(async (tx) => {
        const current_uid = (ctx.user as fbAdmin.auth.DecodedIdToken).uid;
        const todoListDocRef = listsCollRef.doc(args.id);
        const todoListDocSnapshot = await tx.get(todoListDocRef);
        owners = (todoListDocSnapshot.data() as ListDB).owners;
        if (!owners.includes(current_uid)) {
          // TODO: test this
          throw new ForbiddenError(
            "Not authorized to touch anything in this list."
          );
        }
        const todoListData = (await tx.get(todoListDocRef)).data() as ListDB;
        const todosQuerySnapshot = await tx.get(
          todoListDocRef.collection("todos")
        );
        const todos = todosQuerySnapshot.docs.map((d) => ({
          ...(d.data() as TodoDB),
          id: d.id,
          list_id: args.id
        }));
        const { name, order } = args;
        const updates: any = {};
        if (name) updates.name = name;
        if (order) {
          // TODO: implement this on FE and test it
          updates.order = order;
          let listsQuerySnapshot: FirebaseFirestore.QuerySnapshot;
          let adjustment: -1 | 1;
          metadata = { prevOrder: todoListData.order };
          if (order > todoListData.order) {
            listsQuerySnapshot = await tx.get(
              listsCollRef
                .where("order", "<=", order)
                .where("order", ">", todoListData.order)
            );
            adjustment = -1;
          } else {
            listsQuerySnapshot = await tx.get(
              listsCollRef
                .where("order", ">=", order)
                .where("order", "<", todoListData.order)
            );
            adjustment = 1;
          }
          listsQuerySnapshot.forEach((list) => {
            const newOrder = (list.data() as ListDB).order + adjustment;
            tx.update(list.ref, { order: newOrder });
          });
        }
        await tx.update(todoListDocRef, updates);
        return {
          ...todoListData,
          ...updates,
          todos,
          id: args.id
        };
      });
      // ====== END TRANSACTION ===============================================
      pubsub.publish(LIST_EVENTS, {
        listUpdated,
        metadata,
        owners
      });
      return listUpdated;
    } catch (error) {
      console.error(error);
      return { error: error.message };
    }
  },

  /**********************
   * CREATE A TODO
   *********************/
  async createTodo(parent: any, args: any, ctx: Context, info: any) {
    authorize(ctx);
    try {
      let owners: string[] = [];
      // ====== BEGIN TRANSACTION =============================================
      const todoCreated = await firestore.runTransaction(async (tx) => {
        const todoListDocRef = listsCollRef.doc(args.listId);
        const todosCollRef = todoListDocRef.collection("todos");
        const todoListDocSnapshot = await tx.get(todoListDocRef);
        owners = (todoListDocSnapshot.data() as ListDB).owners;
        const currTodosSnapshot = await tx.get(todosCollRef);
        const newTodoDocRef = todosCollRef.doc();
        const added_on = new Date();
        const newTodoData = {
          added_on,
          content: args.content,
          completed: false,
          completed_on: null,
          deadline: args.deadline || null,
          description: "",
          important: args.important,
          order: currTodosSnapshot.size + 1,
          remind_on: args.remind_on || null
        };
        tx.create(newTodoDocRef, newTodoData);
        return {
          ...newTodoData,
          id: newTodoDocRef.id,
          list_id: args.listId
        };
      });
      // ====== END TRANSACTION ===============================================
      pubsub.publish(LIST_EVENTS, {
        todoCreated: {
          ...todoCreated,
          added_on: todoCreated.added_on.toISOString()
        },
        owners
      });
      return todoCreated;
    } catch (error) {
      console.error(error);
      return { error: error.message };
    }
  },

  /**********************
   * DELETE A TODO
   *********************/
  async deleteTodo(parent: any, args: any, ctx: Context, info: any) {
    authorize(ctx);
    let owners: string[] = [];
    try {
      // ====== BEGIN TRANSACTION =============================================
      const todoDeleted = await firestore.runTransaction(async (tx) => {
        const todoListDocRef = listsCollRef.doc(args.listId);
        const todoListDocSnapshot = await tx.get(todoListDocRef);
        owners = (todoListDocSnapshot.data() as ListDB).owners;
        if (!owners.includes((ctx.user as fbAdmin.auth.DecodedIdToken).uid)) {
          // TODO: test this
          throw new ForbiddenError(
            "Not authorized to touch anything in this list."
          );
        }
        const todoDocRef = todoListDocRef.collection("todos").doc(args.todoId);
        const deletedTodoData = (await tx.get(todoDocRef)).data() as TodoDB;

        const todosQuerySnapshot = await tx.get(
          todoListDocRef
            .collection("todos")
            .where("order", ">", deletedTodoData.order)
        );

        tx.delete(todoDocRef);
        todosQuerySnapshot.forEach((todoDoc) => {
          const order = (todoDoc.data() as TodoDB).order;
          tx.update(todoDoc.ref, { order: order - 1 });
        });
        return {
          ...deletedTodoData,
          id: todoDocRef.id,
          list_id: args.listId
        };
      });
      // ====== END TRANSACTION ===============================================

      pubsub.publish(LIST_EVENTS, {
        todoDeleted: convertDateFieldsForPublishing(todoDeleted),
        owners
      });
      return { success: true };
    } catch (error) {
      console.error(error);
      return { error: error.message };
    }
  },

  /**********************
   * UPDATE A TODO
   *********************/
  async updateTodo(parent: any, args: any, ctx: Context, info: any) {
    // TODO: see if this can be merged with createTodo(), since Firestore's
    // set() method handles both creation and updating.
    authorize(ctx);
    try {
      let owners: string[] = [];
      let destListOwners: string[] = [];
      let metadata: { [key: string]: any } | null = null;
      // ====== BEGIN TRANSACTION =============================================
      const todoUpdated = await firestore.runTransaction(async (tx) => {
        const sourceTodoListDocRef = listsCollRef.doc(args.listId);
        let destTodoListDocRef: FirebaseFirestore.DocumentReference = sourceTodoListDocRef;
        const sourceTodoListDocSnapshot = await tx.get(sourceTodoListDocRef);
        owners = (sourceTodoListDocSnapshot.data() as ListDB).owners;
        destListOwners = [...owners];
        if (args.destListId) {
          destTodoListDocRef = listsCollRef.doc(args.destListId);
          destListOwners = ((await tx.get(destTodoListDocRef)).data() as ListDB)
            .owners;
        }
        const ctxUid = (ctx.user as fbAdmin.auth.DecodedIdToken).uid;
        if (!(owners.includes(ctxUid) && destListOwners.includes(ctxUid))) {
          // TODO: test this
          throw new ForbiddenError("Not authorized to touch this data.");
        }
        const { content, order } = args;
        const sourceTodoDocRef = sourceTodoListDocRef
          .collection("todos")
          .doc(args.todoId);
        let destTodoDocRef = sourceTodoDocRef;
        const todoData = (await tx.get(sourceTodoDocRef)).data() as TodoDB;
        const updates: any = { ...todoData };

        // TODO: find a better way to do this
        if (args.hasOwnProperty("completed")) {
          updates.completed = args.completed;
          if (args.completed) updates.completed_on = new Date();
          else updates.completed_on = null;
        }
        if (content) updates.content = content;
        if (args.hasOwnProperty("deadline")) updates.deadline = args.deadline;
        if (args.hasOwnProperty("description"))
          updates.description = args.description;
        if (args.hasOwnProperty("important"))
          updates.important = args.important;
        if (args.hasOwnProperty("remind_on"))
          updates.remind_on = args.remind_on;
        if (order) {
          updates.order = order;
          let todosQuerySnapshot: FirebaseFirestore.QuerySnapshot;
          let adjustment: -1 | 1;
          metadata = { prevOrder: todoData.order };
          if (args.destListId) {
            // TODO IS BEING MOVED TO ANOTHER LIST
            const sourceTodosQuerySnapshot = await tx.get(
              sourceTodoListDocRef
                .collection("todos")
                .where("order", ">", todoData.order)
            );
            const destTodosQuerySnapshot = await tx.get(
              destTodoListDocRef.collection("todos").where("order", ">=", order)
            );
            sourceTodosQuerySnapshot.forEach((todo) => {
              // decrement source todos
              const newOrder = (todo.data() as TodoDB).order - 1;
              tx.update(todo.ref, { order: newOrder });
            });
            destTodosQuerySnapshot.forEach((todo) => {
              // increment destination todos
              const newOrder = (todo.data() as TodoDB).order + 1;
              tx.update(todo.ref, { order: newOrder });
            });
            await tx.delete(sourceTodoDocRef);
            destTodoDocRef = destTodoListDocRef
              .collection("todos")
              .doc(args.todoId);
            metadata.prevListId = sourceTodoListDocRef.id;
          } else {
            // TODO IS CHANGING ORDER WITHIN THE SAME LIST
            if (order > todoData.order) {
              todosQuerySnapshot = await tx.get(
                sourceTodoListDocRef
                  .collection("todos")
                  .where("order", "<=", order)
                  .where("order", ">=", todoData.order)
              );
              adjustment = -1;
            } else {
              todosQuerySnapshot = await tx.get(
                sourceTodoListDocRef
                  .collection("todos")
                  .where("order", ">=", order)
                  .where("order", "<=", todoData.order)
              );
              adjustment = +1;
            }
            todosQuerySnapshot.forEach((todo) => {
              const newOrder = (todo.data() as TodoDB).order + adjustment;
              tx.update(todo.ref, { order: newOrder });
            });
          }
        }
        await tx.set(destTodoDocRef, updates);
        return {
          ...todoData,
          ...updates,
          id: destTodoDocRef.id,
          list_id: destTodoListDocRef.id
        } as TodoDB & { id: string; list_id: string };
      });
      // ====== END TRANSACTION ===============================================
      pubsub.publish(LIST_EVENTS, {
        todoUpdated: convertDateFieldsForPublishing(todoUpdated),
        metadata,
        owners: destListOwners
      });
      return todoUpdated;
    } catch (error) {
      console.error(error);
      return { error: error.message };
    }
  },

  async login(parent: any, args: ILogin, ctx: Context, info: any) {
    if (args.idToken && args.idToken !== "undefined") {
      // User just logged in via email/password and either
      // 1: client is calling this in order to set a session cookie, API <-> CLIENT, or
      // 2: SSR backend is calling this in order to fetch the user object
      //    and set the session cookie, SSR <-> CLIENT
      const decodedIdToken = await verifyIdToken(args.idToken);
      const { uid } = decodedIdToken;
      if (!uid) {
        console.error("User is not registered");
        return {
          error: "User is not registered"
        };
      }

      const user = await getUserRecord(uid);
      const [sessionCookie, expiresIn] = await createUserSessionToken(
        args,
        decodedIdToken
      );
      const options: express.CookieOptions = {
        maxAge: expiresIn,
        httpOnly: true,
        secure: false // TODO: set secure: true in production
      };
      ctx.res.cookie("session", sessionCookie, options);
      return { user };
    } else {
      // User is re-visiting the site and automatically reauthenticating using the
      // existing session cookie (SSR <-> CLIENT).
      const sessionCookie = args.session || "";
      if (sessionCookie) {
        try {
          const decodedClaims = await verifyUserSessionToken(sessionCookie);
          const user = await getUserRecord(decodedClaims.uid);
          return { user };
        } catch (error) {
          // verifyUserSessionToken() will throw if the session cookie
          // is invalid or revoked.
          return {
            error: `Invalid login request: ${error}`
          };
        }
      }
    }
    return {
      error: "Invalid login request"
    };
  },

  async logout(parent: any, args: any, ctx: Context, info: any) {
    const sessionCookie = ctx.req.cookies.session || "";
    if (sessionCookie) {
      ctx.res.clearCookie("session");
      // if (ctx.user) {
      //   try {
      //     await fbAdmin.auth().revokeRefreshTokens(ctx.user.sub);
      //     return {};
      //   } catch (error) {
      //     return {
      //       error
      //     };
      //   }
      // }
    }
    return {
      error: "Session cookie is invalid, or no session to log out of"
    };
  }
};

function authorize(ctx: Context) {
  if (!ctx.user) ctx.res.status(401).send("UNAUTHORIZED REQUEST");
}
