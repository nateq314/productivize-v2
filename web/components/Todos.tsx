import React from "react";
import styled from "styled-components";
import { Todo } from "./Main";
import CreateNewTodo from "./CreateNewTodo";

const StyledTodos = styled.section`
  grid-area: todos;
`;

interface TodosProps {
  todos: Todo[];
}

export default function Todos({ todos }: TodosProps) {
  return (
    <StyledTodos>
      <CreateNewTodo />
      <ul>
        {todos.map((todo) => {
          return <li key={todo.id}>{todo.content}</li>;
        })}
      </ul>
    </StyledTodos>
  );
}
