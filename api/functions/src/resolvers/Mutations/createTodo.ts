import { Context } from '../../apolloServer';
import { firestore, listsCollRef } from '../../firebase';
import { ListDB } from '../../schema';
import { pubsub, LIST_EVENTS } from '../Subscription';
import { authorize } from './auth';

export default async function createTodo(parent: any, args: any, ctx: Context, info: any) {
  authorize(ctx);
  try {
    let members: string[] = [];
    // ====== BEGIN TRANSACTION =============================================
    const todoCreated = await firestore.runTransaction(async (tx) => {
      const todoListDocRef = listsCollRef.doc(args.listId);
      const todosCollRef = todoListDocRef.collection('todos');
      const todoListDocSnapshot = await tx.get(todoListDocRef);
      members = (todoListDocSnapshot.data() as ListDB).members;
      const currTodosSnapshot = await tx.get(todosCollRef);
      const newTodoDocRef = todosCollRef.doc();
      const added_on = new Date();
      const newTodoData = {
        added_on,
        content: args.content,
        completed: false,
        completed_on: null,
        deadline: args.deadline || null,
        description: '',
        important: args.important,
        order: currTodosSnapshot.size + 1,
        remind_on: args.remind_on || null,
      };
      tx.create(newTodoDocRef, newTodoData);
      return {
        ...newTodoData,
        id: newTodoDocRef.id,
        list_id: args.listId,
      };
    });
    // ====== END TRANSACTION ===============================================
    pubsub.publish(LIST_EVENTS, {
      todoCreated: {
        ...todoCreated,
        added_on: todoCreated.added_on.toISOString(),
      },
      members,
    });
    return todoCreated;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}
