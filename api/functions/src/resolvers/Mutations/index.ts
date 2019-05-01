import { TodoDB, TodoGQL } from '../../schema';
import createList from './createList';
import deleteList from './deleteList';
import updateList from './updateList';
import createTodo from './createTodo';
import deleteTodo from './deleteTodo';
import updateTodo from './updateTodo';
import { acceptListInvitation, rejectListInvitation } from './listInvitations';
import { login, logout, register } from './auth';

type TodoDateFields = 'added_on' | 'completed_on' | 'deadline' | 'remind_on';

export function convertDateFieldsForPublishing(todo: TodoDB & { id: string; list_id: string }) {
  const converted: any = { ...todo };
  (['added_on', 'completed_on', 'deadline', 'remind_on'] as Array<TodoDateFields>).forEach(
    (field) => {
      const value = todo[field];
      if (value) {
        converted[field] =
          value instanceof Date ? value.toISOString() : value.toDate().toISOString();
      }
    },
  );
  return converted as TodoGQL;
}

export default {
  createList,
  deleteList,
  updateList,
  createTodo,
  deleteTodo,
  updateTodo,
  acceptListInvitation,
  rejectListInvitation,
  login,
  logout,
  register,
};
