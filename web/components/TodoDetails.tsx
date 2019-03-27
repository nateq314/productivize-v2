import React from "react";
import styled from "styled-components";

const StyledTodoDetails = styled.section`
  grid-area: details;
  border-left: 1px solid #333;
`;

export default function TodoDetails() {
  return (
    <StyledTodoDetails>Individual To-do details will go here</StyledTodoDetails>
  );
}
