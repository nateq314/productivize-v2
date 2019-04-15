import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { TodoList } from "../Main";
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
}

export default function Todos({
  draggingID,
  selectedList,
  selectedTodoId,
  setDraggingID,
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
          {sortedTodos.map((todo, idx) => {
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
