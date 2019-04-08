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

function convertDateFieldsForPublishing(
  todo: TodoDB & { id: string; list_id: string }
): TodoGQL {
  return {
    ...todo,
    added_on: todo.added_on.toDate().toISOString(),
    completed_on: todo.completed_on
      ? todo.completed_on.toDate().toISOString()
      : undefined,
    deadline: todo.deadline ? todo.deadline.toDate().toISOString() : undefined,
    remind_on: todo.remind_on
      ? todo.remind_on.toDate().toISOString()
      : undefined
  };
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
          listsCollRef.where("uid", "==", current_uid)
        );
        const newListDocRef = listsCollRef.doc();
        const newListData = {
          name: args.name,
          order: currUserLists.size + 1,
          uid: current_uid
        } as { [key: string]: any };
        tx.create(newListDocRef, newListData);
        newListData.id = newListDocRef.id;
        newListData.todos = [];
        return newListData as ListGQL;
      });
      // ====== END TRANSACTION ===============================================
      pubsub.publish(LIST_EVENTS, { listCreated, uid: listCreated.uid });
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
        if (deletedListData.uid !== current_uid) {
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
      pubsub.publish(LIST_EVENTS, { listDeleted, uid: listDeleted.uid });
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
    try {
      const current_uid = (ctx.user as fbAdmin.auth.DecodedIdToken).uid;
      const todoListDocRef = listsCollRef.doc(args.id);
      const todoListDocSnapshot = await todoListDocRef.get();
      if ((todoListDocSnapshot.data() as ListDB).uid !== current_uid) {
        // TODO: test this
        throw new ForbiddenError(
          "Not authorized to touch anything in this list."
        );
      }
      const { name, order } = args;
      const updates: any = {};
      if (name) updates.name = name;
      if (order) updates.order = order;

      await todoListDocRef.update(updates);

      const updatedTodoListDocSnapshot = await todoListDocRef.get();
      const newTodoListData = updatedTodoListDocSnapshot.data() as ListDB;
      const listUpdated = {
        ...newTodoListData,
        id: args.id
      };
      pubsub.publish(LIST_EVENTS, { listUpdated, uid: listUpdated.uid });
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
      let uid = "";
      // ====== BEGIN TRANSACTION =============================================
      const todoCreated = await firestore.runTransaction(async (tx) => {
        const todoListDocRef = listsCollRef.doc(args.listId);
        const todosCollRef = todoListDocRef.collection("todos");
        const todoListDocSnapshot = await tx.get(todoListDocRef);
        uid = (todoListDocSnapshot.data() as ListDB).uid;
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
        uid
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
    let uid = "";
    try {
      // ====== BEGIN TRANSACTION =============================================
      const todoDeleted = await firestore.runTransaction(async (tx) => {
        const todoListDocRef = listsCollRef.doc(args.listId);
        const todoListDocSnapshot = await tx.get(todoListDocRef);
        uid = (todoListDocSnapshot.data() as ListDB).uid;
        if (uid !== (ctx.user as fbAdmin.auth.DecodedIdToken).uid) {
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
        uid
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
      let uid = "";
      const todoUpdated = await firestore.runTransaction(async (tx) => {
        const todoListDocRef = listsCollRef.doc(args.listId);
        const todoListDocSnapshot = await tx.get(todoListDocRef);
        uid = (todoListDocSnapshot.data() as ListDB).uid;
        if (uid !== (ctx.user as fbAdmin.auth.DecodedIdToken).uid) {
          // TODO: test this
          throw new ForbiddenError(
            "Not authorized to touch anything in this list."
          );
        }
        const { content, deadline, remind_on, order } = args;
        const todoDocRef = todoListDocRef.collection("todos").doc(args.todoId);
        const todoData = (await tx.get(todoDocRef)).data() as TodoDB;
        const updates: any = {};

        // TODO: find a better way to do this
        if (args.hasOwnProperty("completed")) {
          updates.completed = args.completed;
          if (args.completed) updates.completed_on = new Date();
          else updates.completed_on = null;
        }
        if (content) updates.content = content;
        if (deadline) updates.deadline = deadline;
        if (args.hasOwnProperty("description"))
          updates.description = args.description;
        if (args.hasOwnProperty("important"))
          updates.important = args.important;
        if (order) updates.order = order;
        if (remind_on) updates.remind_on = remind_on;

        await tx.update(todoDocRef, updates);
        if (order) {
          // TODO: implement this on FE and test it
          const todosQuerySnapshot = await tx.get(
            todoListDocRef.collection("todos").where("order", ">=", order)
          );
          todosQuerySnapshot.forEach((todo) => {
            const newOrder = (todo.data() as TodoDB).order + 1;
            tx.update(todo.ref, { order: newOrder });
          });
        }
        return {
          ...todoData,
          ...updates,
          id: todoDocRef.id,
          list_id: args.listId
        };
      });
      pubsub.publish(LIST_EVENTS, {
        todoUpdated: convertDateFieldsForPublishing(todoUpdated),
        uid
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
