import React from "react";
import { Mutation } from "react-apollo";
import { DELETE_TODO } from "../other/mutations";
import { TodoList, Todo } from "./Main";

interface DeleteTodoProps {
  children: (configuredMutationFn: () => void) => React.ReactNode;
  selectedList: TodoList;
  todo: Todo;
}

const optimisticResponse = {
  __typename: "Mutation",
  deleteTodo: {
    __typename: "Result",
    success: true
  }
};

export default function DeleteTodo({
  children,
  selectedList,
  todo
}: DeleteTodoProps) {
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
            cache.writeData({
              data: {
                list: {
                  ...selectedList,
                  todos: selectedList.todos.filter((t) => t.id !== todo.id)
                }
              }
            });
          }
        }
      }}
    >
      {(deleteTodo) =>
        children(() => {
          deleteTodo({
            variables: {
              listId: selectedList.id,
              todoId: todo.id
            }
          });
        })
      }
    </Mutation>
  );
}
