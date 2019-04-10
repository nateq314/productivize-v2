import React, { useState } from "react";
import styled from "styled-components";
import { Todo, TodoList } from "./Main";
import TodoListItem from "./TodoListItem";

const StyledTodosList = styled.ul`
  list-style-type: none;
`;

interface TodosProps {
  draggingID: string | null;
  innerRef: (element: HTMLElement | null) => any;
  placeholder?: React.ReactElement<HTMLElement> | null;
  selectedList: TodoList;
  selectedTodoId: string | null;
  setDraggingID: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedTodoId: React.Dispatch<React.SetStateAction<string | null>>;
  todos: Todo[];
}

export default function Todos({
  draggingID,
  innerRef,
  placeholder,
  selectedList,
  selectedTodoId,
  setDraggingID,
  setSelectedTodoId,
  todos
}: TodosProps) {
  const [currEditing, setCurrEditing] = useState<string | null>(null);

  return (
    <StyledTodosList ref={innerRef}>
      {todos.map((todo, idx) => {
        const isEditing = currEditing === todo.id;
        const isSelected = selectedTodoId === todo.id;
        return (
          <TodoListItem
            key={todo.id}
            index={idx}
            isDragging={draggingID === todo.id}
            isEditing={isEditing}
            isSelected={isSelected}
            selectedList={selectedList}
            setCurrEditing={setCurrEditing}
            setDraggingID={setDraggingID}
            setSelectedTodoId={setSelectedTodoId}
            todo={todo}
          />
        );
      })}
      {placeholder}
    </StyledTodosList>
  );
}
