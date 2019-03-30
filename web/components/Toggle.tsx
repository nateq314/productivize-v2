import React from "react";
import { Mutation } from "react-apollo";
import { Todo, TodoList } from "./Main";
import { UPDATE_TODO } from "../other/queries";

interface ToggleProps {
  children: (toggle: () => void) => React.ReactNode;
  selectedList: TodoList;
  todo: Todo;
  toggleFlag: "completed" | "important";
}

export default function Toggle({
  children,
  selectedList,
  todo,
  toggleFlag
}: ToggleProps) {
  return (
    <Mutation
      mutation={UPDATE_TODO}
      optimisticResponse={{
        __typename: "Mutation",
        updateTodo: {
          ...todo,
          [toggleFlag]: !todo[toggleFlag]
        }
      }}
    >
      {(updateTodo) => {
        const toggle = () => {
          updateTodo({
            variables: {
              listId: selectedList.id,
              todoId: todo.id,
              [toggleFlag]: !todo[toggleFlag]
            }
          });
        };
        return children(toggle);
      }}
    </Mutation>
  );
}
