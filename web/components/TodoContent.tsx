import React, { useEffect, useState } from "react";
import { Mutation } from "react-apollo";
import styled from "styled-components";
import { Todo, TodoList } from "./Main";
import { UPDATE_TODO } from "../other/queries";
import Input from "./Input";

const StyledTodoContent = styled.form`
  display: inline-block;
`;

interface TodoContentProps {
  endEdit: () => void;
  isEditing: boolean;
  selectedList: TodoList;
  todo: Todo;
}

export default function TodoContent(props: TodoContentProps) {
  const { endEdit, isEditing, selectedList, todo } = props;
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
            <Input
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
