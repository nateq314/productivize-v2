import React, { useState } from "react";
import styled from "styled-components";
import { Todo, TodoList } from "./Main";
import CreateNewTodo from "./CreateNewTodo";
import TodoListItem from "./TodoListItem";

const StyledTodos = styled.section`
  grid-area: todos;

  ul {
    list-style-type: none;
  }
`;

interface TodosProps {
  selectedList: TodoList;
  selectedTodoId?: string;
  setSelectedTodoId: React.Dispatch<React.SetStateAction<string | undefined>>;
  todos: Todo[];
}

export default function Todos({
  selectedList,
  selectedTodoId,
  setSelectedTodoId,
  todos
}: TodosProps) {
  const [currEditing, setCurrEditing] = useState<string | null>(null);
  return (
    <StyledTodos>
      <CreateNewTodo selectedList={selectedList} />
      <ul>
        {todos.map((todo) => {
          const isEditing = currEditing === todo.id;
          const isSelected = selectedTodoId === todo.id;
          return (
            <TodoListItem
              key={todo.id}
              isEditing={isEditing}
              isSelected={isSelected}
              selectedList={selectedList}
              setCurrEditing={setCurrEditing}
              setSelectedTodoId={setSelectedTodoId}
              todo={todo}
            />
          );
        })}
      </ul>
    </StyledTodos>
  );
}
