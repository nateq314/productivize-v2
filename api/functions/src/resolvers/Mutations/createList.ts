import * as fbAdmin from 'firebase-admin';
import { Context } from '../../apolloServer';
import { ListDB, ListGQL, UserGQL, UserDB, UID } from '../../schema';
import { authorize } from './auth';
import { pubsub, LIST_EVENTS } from '../Subscription';
import { firestore, listsCollRef } from '../../firebase';

export default async function createList(parent: any, args: any, ctx: Context, info: any) {
  authorize(ctx);
  try {
    const current_uid = (ctx.user as fbAdmin.auth.DecodedIdToken).uid;
    // ====== BEGIN TRANSACTION =============================================
    const listCreated = await firestore.runTransaction(async (tx) => {
      const authUserRecord = await fbAdmin.auth().getUser(current_uid);
      const userDocSnapshot = await tx.get(firestore.collection('users').doc(current_uid));
      const dbUserRecord = userDocSnapshot.data() as UserDB;
      const user: Partial<UserGQL> = {
        ...authUserRecord,
        ...dbUserRecord,
        id: userDocSnapshot.id,
      };
      const currUserLists = await tx.get(
        listsCollRef.where('members', 'array-contains', current_uid),
      );
      const newListDocRef = listsCollRef.doc();
      const order = currUserLists.size + 1;
      const newListData: ListDB = {
        name: args.name,
        members: [current_uid as UID],
        member_info: {
          [current_uid]: {
            is_admin: true,
            order,
          },
        },
        pending_members: [],
      };
      tx.create(newListDocRef, newListData);
      return {
        id: newListDocRef.id,
        members: [
          {
            is_admin: true,
            user,
          },
        ],
        name: newListData.name,
        order,
        todos: [],
      } as ListGQL;
    });
    // ====== END TRANSACTION ===============================================
    pubsub.publish(LIST_EVENTS, {
      listCreated,
      members: [current_uid],
    });
    console.log('listCreated:', listCreated);
    return listCreated;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}
