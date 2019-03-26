import React from "react";
import styled from "styled-components";
import { Todo } from "./AppContent";

const StyledTodos = styled.section`
  grid-area: todos;
  background-color: rgba(0, 255, 0, 0.1);
`;

interface TodoListsProps {
  todos: Todo[];
}

export default function Todos({ todos }: TodoListsProps) {
  return (
    <StyledTodos>
      <ul>
        {todos.map((todo) => {
          return <li key={todo.id}>{todo.content}</li>;
        })}
      </ul>
    </StyledTodos>
  );
}
