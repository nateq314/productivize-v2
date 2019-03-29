import React from "react";
import { Mutation } from "react-apollo";
import styled from "styled-components";
import { Todo, TodoList } from "./Main";
import { UPDATE_TODO } from "../other/queries";

const StyledCompletedCheckbox = styled.input``;

interface CompletedCheckboxProps {
  selectedList: TodoList;
  todo: Todo;
}

export default function CompletedCheckbox({
  selectedList,
  todo
}: CompletedCheckboxProps) {
  return (
    <Mutation
      mutation={UPDATE_TODO}
      optimisticResponse={{
        __typename: "Mutation",
        updateTodo: {
          ...todo,
          completed: !todo.completed
        }
      }}
      update={(cache, { data }) => {
        if (data) {
          const { updateTodo } = data;
          cache.writeData({
            data: {
              list: {
                ...selectedList,
                todos: selectedList.todos.map((t) =>
                  t.id === todo.id ? updateTodo : t
                )
              }
            }
          });
        }
      }}
    >
      {(updateTodo) => {
        return (
          <StyledCompletedCheckbox
            type="checkbox"
            checked={todo.completed}
            onChange={() => {
              updateTodo({
                variables: {
                  listId: selectedList.id,
                  todoId: todo.id,
                  completed: !todo.completed
                }
              });
            }}
          />
        );
      }}
    </Mutation>
  );
}
