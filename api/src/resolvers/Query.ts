import * as fbAdmin from 'firebase-admin';
import { ApolloError } from 'apollo-server-express';
import { Context } from '../apolloServer';
import { ListDB, UserGQL } from '../schema';

export default {
  async current_user(parent: any, args: any, ctx: Context, info: any) {
    if (ctx.user) {
      const userDocSnapshot = await fbAdmin
        .firestore()
        .collection('users')
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
        .collection('lists')
        .where('members', 'array-contains', uid)
        .get();
      const lists = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const list = {
            ...(doc.data() as ListDB),
            id: doc.id,
          } as ListDB;
          return list;
        }),
      );
      return lists;
    } catch (error) {
      console.error('Error retrieving lists:', error);
      throw new ApolloError(`Error getting document: ${error}`);
    }
  },
};

function authorize(ctx: Context) {
  if (!ctx.user) ctx.res.status(401).send('UNAUTHORIZED REQUEST');
}
