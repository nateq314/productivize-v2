import React from "react";
import { Mutation } from "react-apollo";
import { DELETE_TODO } from "../other/mutations";
import { TodoList, Todo } from "./Main";
import { FETCH_LIST } from "../other/fragments";

interface DeleteTodoProps {
  children: (configuredMutationFn: () => void) => React.ReactNode;
  todo: Todo;
}

const optimisticResponse = {
  __typename: "Mutation",
  deleteTodo: {
    __typename: "Result",
    success: true
  }
};

export default function DeleteTodo({ children, todo }: DeleteTodoProps) {
  return (
    <Mutation
      mutation={DELETE_TODO}
      optimisticResponse={optimisticResponse}
      update={(cache, { data }) => {
        if (data) {
          const {
            deleteTodo: { success }
          } = data;
          if (success) {
            const list = cache.readFragment<TodoList>({
              id: `List:${todo.list_id}`,
              fragment: FETCH_LIST
            });
            if (list) {
              cache.writeData({
                data: {
                  list: {
                    ...list,
                    todos: list.todos
                      .filter((t) => t.id !== todo.id)
                      .map((t) => {
                        return t.order > todo.order
                          ? { ...t, order: t.order - 1 }
                          : t;
                      })
                  }
                }
              });
            }
          }
        }
      }}
    >
      {(deleteTodo) =>
        children(() => {
          deleteTodo({
            variables: {
              listId: todo.list_id,
              todoId: todo.id
            }
          });
        })
      }
    </Mutation>
  );
}
