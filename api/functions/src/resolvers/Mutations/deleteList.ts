import { ForbiddenError } from 'apollo-server-express';
import * as fbAdmin from 'firebase-admin';
import { Context } from '../../apolloServer';
import { authorize } from './auth';
import { firestore, listsCollRef } from '../../firebase';
import { ListDB, ListGQL, UserGQL, UserDB } from '../../schema';
import { pubsub, LIST_EVENTS } from '../Subscription';

export default async function deleteList(parent: any, args: any, ctx: Context, info: any) {
  authorize(ctx);
  try {
    const current_uid = (ctx.user as fbAdmin.auth.DecodedIdToken).uid;
    const todoListDocRef = listsCollRef.doc(args.id);
    let members: string[] = [];
    // ====== BEGIN TRANSACTION =============================================
    const listDeleted = await firestore.runTransaction(async (tx) => {
      const deletedListData = (await tx.get(todoListDocRef)).data() as ListDB;
      members = deletedListData.members;
      if (!members.includes(current_uid)) {
        // TODO: test this
        throw new ForbiddenError('You are not authorized to touch this list.');
      }
      const membersGQL = await Promise.all(
        deletedListData.members.map(async (member_uid) => {
          const authUserRecord = await fbAdmin.auth().getUser(current_uid);
          const userDocSnapshot = await tx.get(firestore.collection('users').doc(member_uid));
          const dbUserRecord = userDocSnapshot.data() as UserDB;
          const user: Partial<UserGQL> = {
            ...authUserRecord,
            ...dbUserRecord,
            id: userDocSnapshot.id,
          };
          return {
            ...deletedListData.member_info[member_uid],
            user,
          };
        }),
      );
      const higherOrderLists = await tx.get(
        listsCollRef.where(
          `member_info.${current_uid}.order`,
          '>',
          deletedListData.member_info[current_uid].order,
        ),
      );
      // First delete all the todos in the "todos" subcollection, if any.
      const todos = await todoListDocRef.collection('todos').listDocuments();
      todos.forEach((todo) => {
        tx.delete(todo);
      });
      // Then delete the list itself.
      tx.delete(todoListDocRef);
      higherOrderLists.forEach((list) => {
        const order = (list.data() as ListDB).member_info[current_uid].order;
        tx.update(list.ref, `member_info.${current_uid}.order`, order - 1);
      });
      return {
        ...deletedListData,
        id: todoListDocRef.id,
        members: membersGQL,
      } as Partial<ListGQL>;
    });
    // ====== END TRANSACTION ===============================================
    console.log('listDeleted:', listDeleted);
    pubsub.publish(LIST_EVENTS, {
      listDeleted,
      members,
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}
