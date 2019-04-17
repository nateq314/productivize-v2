import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { TodoList } from "../Main";
import TodoItem from "./TodoItem";
import { Droppable } from "react-beautiful-dnd";
import { DragState } from "./TodosPane";

const StyledTodos = styled.ul`
  list-style-type: none;

  h2 {
    text-align: left;
  }
`;

interface TodosProps {
  dragState: DragState;
  selectedList: TodoList;
  selectedTodoId: string | null;
  setDragState: React.Dispatch<React.SetStateAction<DragState>>;
  setSelectedTodoId: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function Todos({
  dragState,
  selectedList,
  selectedTodoId,
  setDragState,
  setSelectedTodoId
}: TodosProps) {
  const [currEditing, setCurrEditing] = useState<string | null>(null);
  const sortedTodos = useMemo(() => {
    return [...selectedList.todos].sort((todoA, todoB) =>
      todoB.order > todoA.order ? -1 : 1
    );
  }, [selectedList.todos]);

  return (
    <Droppable droppableId={selectedList.id}>
      {(provided) => (
        <StyledTodos {...provided.droppableProps} ref={provided.innerRef}>
          <h2>{selectedList.name}</h2>
          {sortedTodos.map((todo, idx) => {
            const isEditing = currEditing === todo.id;
            const isSelected = selectedTodoId === todo.id;
            return (
              <TodoItem
                key={todo.id}
                index={idx}
                isDragging={dragState.draggableID === todo.id}
                isEditing={isEditing}
                isSelected={isSelected}
                setCurrEditing={setCurrEditing}
                setDragState={setDragState}
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
