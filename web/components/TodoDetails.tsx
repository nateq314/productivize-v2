import React from "react";
import styled from "styled-components";

const StyledTodoDetails = styled.section`
  grid-area: details;
  background-color: rgba(0, 0, 255, 0.1);
`;

export default function TodoDetails() {
  return (
    <StyledTodoDetails>Individual To-do details will go here</StyledTodoDetails>
  );
}
