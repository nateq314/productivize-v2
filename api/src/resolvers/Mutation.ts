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
import { List } from "../schema";

interface ILogin {
  idToken?: string;
  session?: string;
}

export default {
  // foo() {
  //   pubsub.publish(SOMETHING_CHANGED_TOPIC, { message: "hello" });
  //   return {
  //     message: "hello"
  //   };
  // },

  async createList(parent: any, args: any, ctx: Context, info: any) {
    authorize(ctx);
    try {
      const currUserLists = await fbAdmin
        .firestore()
        .collection("lists")
        .where("uid", "==", (ctx.user as fbAdmin.auth.DecodedIdToken).uid)
        .get();
      const newListDocument = await fbAdmin
        .firestore()
        .collection("lists")
        .add({
          name: args.name,
          order: currUserLists.size + 1,
          uid: (ctx.user as fbAdmin.auth.DecodedIdToken).uid
        });
      const newListDocSnapshot = await newListDocument.get();
      const list = newListDocSnapshot.data();

      if (list) {
        return { ...list, id: newListDocument.id, todos: [] };
      }
    } catch (error) {
      console.error(error);
      return { error: error.message };
    }
    return { error: "List Creation Error" };
  },

  async createTodo(parent: any, args: any, ctx: Context, info: any) {
    authorize(ctx);
    try {
      const todosColRef = fbAdmin
        .firestore()
        .collection("lists")
        .doc(args.listId)
        .collection("todos");
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
      const newTodo = newTodoDocSnapshot.data();

      if (newTodo) {
        return {
          ...newTodo,
          id: newTodoDocRef.id
        };
      }
    } catch (error) {
      console.error(error);
    }
    return { error: "Todo Creation Error" };
  },

  async deleteTodo(parent: any, args: any, ctx: Context, info: any) {
    authorize(ctx);
    try {
      const todoListDocRef = fbAdmin
        .firestore()
        .collection("lists")
        .doc(args.listId);
      const todoListDocSnapshot = await todoListDocRef.get();
      if (
        (todoListDocSnapshot.data() as List).uid !==
        (ctx.user as fbAdmin.auth.DecodedIdToken).uid
      ) {
        // TODO: test this
        throw new ForbiddenError(
          "Not authorized to touch anything in this list."
        );
      }
      await todoListDocRef
        .collection("todos")
        .doc(args.todoId)
        .delete();
      return { success: true };
    } catch (error) {
      console.error(error);
    }
    return { error: "Todo Deletion Error" };
  },

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
      if (
        (todoListDocSnapshot.data() as List).uid !==
        (ctx.user as fbAdmin.auth.DecodedIdToken).uid
      ) {
        // TODO: test this
        throw new ForbiddenError(
          "Not authorized to touch anything in this list."
        );
      }
      const { content } = args;
      const todoDocRef = todoListDocRef.collection("todos").doc(args.todoId);
      const updates: any = {};

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
      if (args.hasOwnProperty("important")) updates.important = args.important;
      if (args.hasOwnProperty("remind_on")) updates.remind_on = args.remind_on;

      await todoDocRef.update(updates);
      const updatedTodo = await todoDocRef.get();
      return {
        ...updatedTodo.data(),
        id: todoDocRef.id
      };
    } catch (error) {
      console.error(error);
    }
    return { error: "Todo Update Error" };
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
      if (ctx.user) {
        try {
          await fbAdmin.auth().revokeRefreshTokens(ctx.user.sub);
          return {};
        } catch (error) {
          return {
            error
          };
        }
      }
    }
    return {
      error: "Session cookie is invalid, or no session to log out of"
    };
  }
};

function authorize(ctx: Context) {
  if (!ctx.user) ctx.res.status(401).send("UNAUTHORIZED REQUEST");
}
