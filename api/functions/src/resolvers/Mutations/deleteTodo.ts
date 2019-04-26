import * as fbAdmin from 'firebase-admin';
import { ForbiddenError } from 'apollo-server-express';
import { Context } from '../../apolloServer';
import { firestore, listsCollRef } from '../../firebase';
import { ListDB, TodoDB } from '../../schema';
import { pubsub, LIST_EVENTS } from '../Subscription';
import { convertDateFieldsForPublishing } from './index';
import { authorize } from './auth';

export default async function deleteTodo(parent: any, args: any, ctx: Context, info: any) {
  authorize(ctx);
  let members: string[] = [];
  try {
    // ====== BEGIN TRANSACTION =============================================
    const todoDeleted = await firestore.runTransaction(async (tx) => {
      const todoListDocRef = listsCollRef.doc(args.listId);
      const todoListDocSnapshot = await tx.get(todoListDocRef);
      members = (todoListDocSnapshot.data() as ListDB).members;
      if (!members.includes((ctx.user as fbAdmin.auth.DecodedIdToken).uid)) {
        // TODO: test this
        throw new ForbiddenError('Not authorized to touch anything in this list.');
      }
      const todoDocRef = todoListDocRef.collection('todos').doc(args.todoId);
      const deletedTodoData = (await tx.get(todoDocRef)).data() as TodoDB;

      const todosQuerySnapshot = await tx.get(
        todoListDocRef.collection('todos').where('order', '>', deletedTodoData.order),
      );

      tx.delete(todoDocRef);
      todosQuerySnapshot.forEach((todoDoc) => {
        const order = (todoDoc.data() as TodoDB).order;
        tx.update(todoDoc.ref, { order: order - 1 });
      });
      return {
        ...deletedTodoData,
        id: todoDocRef.id,
        list_id: args.listId,
      };
    });
    // ====== END TRANSACTION ===============================================

    pubsub.publish(LIST_EVENTS, {
      todoDeleted: convertDateFieldsForPublishing(todoDeleted),
      members,
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}
