import * as fbAdmin from "firebase-admin";
import { ApolloError } from "apollo-server-express";
import { Context } from "../apolloServer";
import { ListDB, ListGQL, UserDB, UserGQL } from "../schema";

export default {
  async current_user(parent: any, args: any, ctx: Context, info: any) {
    if (ctx.user) {
      const userDocSnapshot = await fbAdmin
        .firestore()
        .collection("users")
        .doc(ctx.user.uid)
        .get();
      const user = userDocSnapshot.data() as Partial<UserGQL>;
      user.id = userDocSnapshot.id;
      return user;
    }
    return ctx.user;
  },
  async lists(parent: any, args: any, ctx: Context, info: any) {
    authorize(ctx);
    const { uid } = ctx.user as fbAdmin.auth.DecodedIdToken;
    // TODO: put this in a transaction
    try {
      const querySnapshot = await fbAdmin
        .firestore()
        .collection("lists")
        .where("members", "array-contains", uid)
        .get();
      const lists = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data() as ListDB;
          const order = data.member_info[uid].order;
          const list = {
            ...data,
            order,
            members: await Promise.all(
              data.members.map(async (member_uid) => {
                const authUserRecord = await fbAdmin.auth().getUser(member_uid);
                const userDocSnapshot = await fbAdmin
                  .firestore()
                  .collection("users")
                  .doc(member_uid)
                  .get();
                const member = {
                  ...data.member_info[member_uid],
                  user: {
                    ...(userDocSnapshot.data() as UserDB),
                    ...authUserRecord,
                    id: userDocSnapshot.id
                  }
                };
                return member;
              })
            ),
            id: doc.id
          } as Partial<ListGQL>;
          return list;
        })
      );
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
