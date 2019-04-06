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

export default {
  /**********************
   * CREATE A LIST
   *********************/
  async createList(parent: any, args: any, ctx: Context, info: any) {
    authorize(ctx);
    try {
      const current_uid = (ctx.user as fbAdmin.auth.DecodedIdToken).uid;
      const currUserLists = await fbAdmin
        .firestore()
        .collection("lists")
        .where("uid", "==", current_uid)
        .get();
      const newListDocument = await fbAdmin
        .firestore()
        .collection("lists")
        .add({
          name: args.name,
          order: currUserLists.size + 1,
          uid: current_uid
        });
      const newListDocSnapshot = await newListDocument.get();
      const listCreated: ListGQL = {
        ...(newListDocSnapshot.data() as ListDB),
        id: newListDocument.id,
        todos: []
      };
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
      const todoListDocRef = fbAdmin
        .firestore()
        .collection("lists")
        .doc(args.id);
      const todoListDocSnapshot = await todoListDocRef.get();
      if ((todoListDocSnapshot.data() as ListDB).uid !== current_uid) {
        // TODO: test this
        throw new ForbiddenError("You are not authorized to touch this list.");
      }
      // TODO: Also delete the todos subcollection! Otherwise the below
      // delete() call will leave phantom documents in the database
      // (documents with no fields but with a todos subcollection)
      await todoListDocRef.delete();
      const listDeleted = {
        ...(todoListDocSnapshot.data() as ListDB),
        id: args.id
      };
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
      const todoListDocRef = fbAdmin
        .firestore()
        .collection("lists")
        .doc(args.id);
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
      const todoListDocRef = fbAdmin
        .firestore()
        .collection("lists")
        .doc(args.listId);
      const todosColRef = todoListDocRef.collection("todos");
      const todoListDocSnapshot = await todoListDocRef.get();
      const { uid } = todoListDocSnapshot.data() as ListDB;
      const currTodosSnapshot = await todosColRef.get();
      const newTodoDocRef = await todosColRef.add({
        added_on: new Date(),
        content: args.content,
        completed: false,
        completed_on: null,
        deadline: args.deadline || null,
        description: "",
        important: args.important,
        order: currTodosSnapshot.size + 1,
        remind_on: args.remind_on || null
      });
      const newTodoDocSnapshot = await newTodoDocRef.get();
      const newTodoData = newTodoDocSnapshot.data() as TodoDB;
      const todoCreated = {
        ...newTodoData,
        id: newTodoDocRef.id,
        list_id: args.listId
      };
      pubsub.publish(LIST_EVENTS, {
        todoCreated: convertDateFieldsForPublishing(todoCreated),
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
    try {
      const todoListDocRef = fbAdmin
        .firestore()
        .collection("lists")
        .doc(args.listId);
      const todoListDocSnapshot = await todoListDocRef.get();
      const { uid } = todoListDocSnapshot.data() as ListDB;
      if (uid !== (ctx.user as fbAdmin.auth.DecodedIdToken).uid) {
        // TODO: test this
        throw new ForbiddenError(
          "Not authorized to touch anything in this list."
        );
      }
      const todoDocRef = todoListDocRef.collection("todos").doc(args.todoId);
      const todoDeleted = {
        ...((await todoDocRef.get()).data() as TodoDB),
        id: todoDocRef.id,
        list_id: args.listId
      };

      // Delete the document, then decrement the order of every todo that has an
      // order greater than the one deleted.
      // TODO: ALSO DO THIS FOR UPDATING, IN THE CASE THE ORDER FIELD IS CHANGED
      // TODO: ALSO DO THIS FOR LIST DELETION & UPDATING
      // TODO: REFLECT CHANGES ON FRONT END
      await fbAdmin.firestore().runTransaction(async (tx) => {
        const todosQuerySnapshot = await tx.get(
          todoListDocRef
            .collection("todos")
            .where("order", ">", todoDeleted.order)
        );

        tx.delete(todoDocRef);
        todosQuerySnapshot.forEach((todoDoc) => {
          const order = (todoDoc.data() as TodoDB).order;
          tx.update(todoDoc.ref, { order: order - 1 });
        });
      });

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
      const todoListDocRef = fbAdmin
        .firestore()
        .collection("lists")
        .doc(args.listId);
      const todoListDocSnapshot = await todoListDocRef.get();
      const { uid } = todoListDocSnapshot.data() as ListDB;
      if (uid !== (ctx.user as fbAdmin.auth.DecodedIdToken).uid) {
        // TODO: test this
        throw new ForbiddenError(
          "Not authorized to touch anything in this list."
        );
      }
      const { content, deadline, remind_on, order } = args;
      const todoDocRef = todoListDocRef.collection("todos").doc(args.todoId);
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
      if (args.hasOwnProperty("important")) updates.important = args.important;
      if (remind_on) updates.remind_on = remind_on;

      if (!order) {
        // Updates to anything besides 'order' don't affect other todos. Just
        // go ahead and do the update.
        await todoDocRef.update(updates);
      } else {
        // Updating 'order' means we have to increment the order of all other
        // todos with an order greater than the one being updated.
        // TODO: implement this on FE and test it
        await fbAdmin.firestore().runTransaction(async (tx) => {
          const todosQuerySnapshot = await tx.get(
            todoListDocRef.collection("todos").where("order", ">=", order)
          );
          tx.update(todoDocRef, updates);
          todosQuerySnapshot.forEach((todo) => {
            const newOrder = (todo.data() as TodoDB).order + 1;
            tx.update(todo.ref, { order: newOrder });
          });
        });
      }
      const updatedTodoDocSnapshot = await todoDocRef.get();
      const todoUpdated = {
        ...(updatedTodoDocSnapshot.data() as TodoDB),
        id: todoDocRef.id,
        list_id: args.listId
      };
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
