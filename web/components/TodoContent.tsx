import React, { useEffect, useState } from "react";
import { Mutation } from "react-apollo";
import styled from "styled-components";
import { Todo, TodoList } from "./Main";
import { UPDATE_TODO } from "../other/queries";

const StyledTodoContent = styled.form`
  display: inline-block;
`;

interface TodoContentProps {
  endEdit: () => void;
  isEditing: boolean;
  selectedList: TodoList;
  todo: Todo;
}

export default function TodoContent({
  endEdit,
  isEditing,
  selectedList,
  todo
}: TodoContentProps) {
  const [pendingContent, setPendingContent] = useState(todo.content);
  useEffect(() => {
    setPendingContent(todo.content);
  }, [isEditing]);

  return (
    <Mutation
      mutation={UPDATE_TODO}
      optimisticResponse={{
        __typename: "Mutation",
        updateTodo: {
          ...todo,
          content: pendingContent
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
          <StyledTodoContent
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              updateTodo({
                variables: {
                  listId: selectedList.id,
                  todoId: todo.id,
                  content: pendingContent
                }
              });
              endEdit();
            }}
          >
            <input
              readOnly={!isEditing}
              value={isEditing ? pendingContent : todo.content}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setPendingContent(e.target.value);
              }}
            />
          </StyledTodoContent>
        );
      }}
    </Mutation>
  );
}
