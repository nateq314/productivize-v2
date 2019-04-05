import * as fbAdmin from "firebase-admin";
import { ApolloError } from "apollo-server-express";
import { Context } from "../apolloServer";
import { ListDB } from "../schema";

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
      const lists = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const list = {
          ...data,
          id: doc.id
        } as ListDB & { id: string };
        return list;
      });
      return lists;
    } catch (error) {
      console.error("Error retrieving lists:", error);
      throw new ApolloError(`Error getting document: ${error}`);
    }
  }
};

function authorize(ctx: Context) {
  if (!ctx.user) ctx.res.status(401).send("UNAUTHORIZED REQUEST");
}
