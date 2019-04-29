import * as fbAdmin from 'firebase-admin';
import { Context } from '../../apolloServer';
import { ListDB, UID } from '../../schema';
import { authorize } from './auth';
import { pubsub, LIST_EVENTS } from '../Subscription';
import { firestore, listsCollRef } from '../../firebase';

export default async function createList(parent: any, args: any, ctx: Context, info: any) {
  console.log('RESOLVER createList()');
  authorize(ctx);
  try {
    const current_uid = (ctx.user as fbAdmin.auth.DecodedIdToken).uid;
    // ====== BEGIN TRANSACTION =============================================
    const listCreated = await firestore.runTransaction(async (tx) => {
      const currUserLists = await tx.get(
        listsCollRef.where('members', 'array-contains', current_uid),
      );
      const newListDocRef = listsCollRef.doc();
      const order = currUserLists.size + 1;
      const newListData: ListDB = {
        admin: current_uid,
        name: args.name,
        members: [current_uid as UID],
        member_info: {
          [current_uid]: {
            order,
          },
        },
        pending_members: [],
      };
      tx.create(newListDocRef, newListData);
      return {
        admin: current_uid, // admin: handle with List.admin resolver
        id: newListDocRef.id,
        name: newListData.name,
        order,
        pending_members: [], // TODO: handle pending members args
        todos: [],
        members: [current_uid] as UID[], // handle with List.members resolver
      } as Partial<ListDB>;
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
