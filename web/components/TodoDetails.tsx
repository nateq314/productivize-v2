import React from "react";
import styled from "styled-components";
import { Todo } from "./Main";

const StyledTodoDetails = styled.section`
  grid-area: details;
  border-left: 1px solid #333;
`;

interface TodoDetailsProps {
  todo?: Todo;
}

export default function TodoDetails({ todo }: TodoDetailsProps) {
  return (
    <StyledTodoDetails>
      {todo ? (
        <>
          <header>{todo.content}</header>
          <h4>Description</h4>
          <textarea readOnly value={todo.description} />
        </>
      ) : null}
    </StyledTodoDetails>
  );
}
