import React, { useState } from "react";
import styled from "styled-components";
import { Todo, TodoList } from "../Main";
import TodoItem from "./TodoItem";
import { Droppable } from "react-beautiful-dnd";

const StyledTodos = styled.ul`
  list-style-type: none;
`;

interface TodosProps {
  draggingID: string | null;
  selectedList: TodoList;
  selectedTodoId: string | null;
  setDraggingID: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedTodoId: React.Dispatch<React.SetStateAction<string | null>>;
  todos: Todo[];
}

export default function Todos({
  draggingID,
  selectedList,
  selectedTodoId,
  setDraggingID,
  setSelectedTodoId,
  todos
}: TodosProps) {
  const [currEditing, setCurrEditing] = useState<string | null>(null);

  return (
    <Droppable droppableId={selectedList.id}>
      {(provided) => (
        <StyledTodos {...provided.droppableProps} ref={provided.innerRef}>
          {todos.map((todo, idx) => {
            const isEditing = currEditing === todo.id;
            const isSelected = selectedTodoId === todo.id;
            return (
              <TodoItem
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
          {provided.placeholder}
        </StyledTodos>
      )}
    </Droppable>
  );
}
