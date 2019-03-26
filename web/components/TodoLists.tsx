import React from "react";
import styled from "styled-components";
import { TodoList } from "./AppContent";

const StyledTodoLists = styled.section`
  grid-area: lists;
  background-color: rgba(255, 0, 0, 0.1);
`;

interface TodoListsProps {
  lists: TodoList[];
}

export default function TodoLists({ lists }: TodoListsProps) {
  return (
    <StyledTodoLists>
      <ul>
        {lists.map((list) => {
          return <li key={list.id}>{list.name}</li>;
        })}
      </ul>
    </StyledTodoLists>
  );
}
