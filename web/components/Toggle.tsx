import React from "react";
import { Mutation } from "react-apollo";
import { Todo } from "./Main";
import { UPDATE_TODO } from "../other/mutations";

interface ToggleProps {
  children: (toggle: () => void) => React.ReactNode;
  todo: Todo;
  toggleFlag: "completed" | "important";
}

export default function Toggle({ children, todo, toggleFlag }: ToggleProps) {
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
              listId: todo.list_id,
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
