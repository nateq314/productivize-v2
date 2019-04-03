import * as fbAdmin from "firebase-admin";
import { ApolloError } from "apollo-server-express";
import { Context } from "../apolloServer";
import { List, Todo } from "../schema";

export default {
  async current_user(parent: any, args: any, ctx: Context, info: any) {
    return ctx.user;
  },
  async lists(parent: any, args: any, ctx: Context, info: any) {
    authorize(ctx);
    const { uid } = ctx.user as fbAdmin.auth.DecodedIdToken;
    try {
      const querySnapshot = await fbAdmin
        .firestore()
        .collection("lists")
        .where("uid", "==", uid)
        .get();
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        // In Cloud Firestore there is no such thing as an empty collection.
        // If there aren't any items, the collection or subcollction won't exist.
        const todos = data.todos
          ? data.todos.map((todo: Todo) => ({
              ...todo,
              list_id: doc.id
            }))
          : [];
        const list = {
          ...data,
          todos,
          id: doc.id
        } as List;
        return list;
      });
    } catch (error) {
      console.error("Error retrieving lists:", error);
      throw new ApolloError(`Error getting document: ${error}`);
    }
  }
};

function authorize(ctx: Context) {
  if (!ctx.user) ctx.res.status(401).send("UNAUTHORIZED REQUEST");
}
