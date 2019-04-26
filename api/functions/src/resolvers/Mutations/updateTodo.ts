import * as fbAdmin from 'firebase-admin';
import { ForbiddenError } from 'apollo-server-express';
import { Context } from '../../apolloServer';
import { firestore, listsCollRef } from '../../firebase';
import { ListDB, TodoDB } from '../../schema';
import { pubsub, LIST_EVENTS } from '../Subscription';
import { convertDateFieldsForPublishing } from './index';
import { authorize } from './auth';

/**********************
 * UPDATE A TODO
 *********************/
export default async function updateTodo(parent: any, args: any, ctx: Context, info: any) {
  // TODO: see if this can be merged with createTodo(), since Firestore's
  // set() method handles both creation and updating.
  authorize(ctx);
  try {
    let members: string[] = [];
    let destListMembers: string[] = [];
    let metadata: { [key: string]: any } | null = null;
    // ====== BEGIN TRANSACTION =============================================
    const todoUpdated = await firestore.runTransaction(async (tx) => {
      const sourceTodoListDocRef = listsCollRef.doc(args.listId);
      let destTodoListDocRef: FirebaseFirestore.DocumentReference = sourceTodoListDocRef;
      const sourceTodoListDocSnapshot = await tx.get(sourceTodoListDocRef);
      members = (sourceTodoListDocSnapshot.data() as ListDB).members;
      destListMembers = [...members];
      if (args.destListId) {
        destTodoListDocRef = listsCollRef.doc(args.destListId);
        destListMembers = ((await tx.get(destTodoListDocRef)).data() as ListDB).members;
      }
      const ctxUid = (ctx.user as fbAdmin.auth.DecodedIdToken).uid;
      if (!(members.includes(ctxUid) && destListMembers.includes(ctxUid))) {
        // TODO: test this
        throw new ForbiddenError('Not authorized to touch this data.');
      }
      const { content, order } = args;
      const sourceTodoDocRef = sourceTodoListDocRef.collection('todos').doc(args.todoId);
      let destTodoDocRef = sourceTodoDocRef;
      const todoData = (await tx.get(sourceTodoDocRef)).data() as TodoDB;
      const updates: any = { ...todoData };

      // TODO: find a better way to do this
      if (args.hasOwnProperty('completed')) {
        updates.completed = args.completed;
        if (args.completed) updates.completed_on = new Date();
        else updates.completed_on = null;
      }
      if (content) updates.content = content;
      if (args.hasOwnProperty('deadline')) updates.deadline = args.deadline;
      if (args.hasOwnProperty('description')) updates.description = args.description;
      if (args.hasOwnProperty('important')) updates.important = args.important;
      if (args.hasOwnProperty('remind_on')) updates.remind_on = args.remind_on;
      if (order) {
        updates.order = order;
        let todosQuerySnapshot: FirebaseFirestore.QuerySnapshot;
        let adjustment: -1 | 1;
        metadata = { prevOrder: todoData.order };
        if (args.destListId) {
          // TODO IS BEING MOVED TO ANOTHER LIST
          const sourceTodosQuerySnapshot = await tx.get(
            sourceTodoListDocRef.collection('todos').where('order', '>', todoData.order),
          );
          const destTodosQuerySnapshot = await tx.get(
            destTodoListDocRef.collection('todos').where('order', '>=', order),
          );
          sourceTodosQuerySnapshot.forEach((todo) => {
            // decrement source todos
            const newOrder = (todo.data() as TodoDB).order - 1;
            tx.update(todo.ref, { order: newOrder });
          });
          destTodosQuerySnapshot.forEach((todo) => {
            // increment destination todos
            const newOrder = (todo.data() as TodoDB).order + 1;
            tx.update(todo.ref, { order: newOrder });
          });
          await tx.delete(sourceTodoDocRef);
          destTodoDocRef = destTodoListDocRef.collection('todos').doc(args.todoId);
          metadata.prevListId = sourceTodoListDocRef.id;
        } else {
          // TODO IS CHANGING ORDER WITHIN THE SAME LIST
          if (order > todoData.order) {
            todosQuerySnapshot = await tx.get(
              sourceTodoListDocRef
                .collection('todos')
                .where('order', '<=', order)
                .where('order', '>=', todoData.order),
            );
            adjustment = -1;
          } else {
            todosQuerySnapshot = await tx.get(
              sourceTodoListDocRef
                .collection('todos')
                .where('order', '>=', order)
                .where('order', '<=', todoData.order),
            );
            adjustment = +1;
          }
          todosQuerySnapshot.forEach((todo) => {
            const newOrder = (todo.data() as TodoDB).order + adjustment;
            tx.update(todo.ref, { order: newOrder });
          });
        }
      }
      await tx.set(destTodoDocRef, updates);
      return {
        ...todoData,
        ...updates,
        id: destTodoDocRef.id,
        list_id: destTodoListDocRef.id,
      } as TodoDB & { id: string; list_id: string };
    });
    // ====== END TRANSACTION ===============================================
    pubsub.publish(LIST_EVENTS, {
      todoUpdated: convertDateFieldsForPublishing(todoUpdated),
      metadata,
      members: destListMembers,
    });
    return todoUpdated;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}
