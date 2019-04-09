import React from "react";
import { Draggable } from "react-beautiful-dnd";
import styled from "styled-components";
import DeleteTodo from "./DeleteTodo";
import { Todo, TodoList } from "./Main";
import TodoContent from "./TodoContent";
import Toggle from "./Toggle";

const StyledTodoListItem = styled.li`
  padding: 10px 0px;
  margin-bottom: 10px;
  background-color: #1d1d34;
  border-radius: 8px;

  &.important {
    .toggleImportant {
      background-color: #f00;
    }
  }

  &.selected {
    background-color: #555;
  }
`;

interface TodoListItemProps {
  index: number;
  isEditing: boolean;
  isSelected: boolean;
  selectedList: TodoList;
  setCurrEditing: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedTodoId: React.Dispatch<React.SetStateAction<string | null>>;
  todo: Todo;
}

export default function TodoListItem({
  index,
  isEditing,
  isSelected,
  selectedList,
  setCurrEditing,
  setSelectedTodoId,
  todo
}: TodoListItemProps) {
  return (
    <Draggable draggableId={todo.id} index={index}>
      {(provided) => (
        <StyledTodoListItem
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          className={
            (isSelected ? `selected ` : "") +
            (todo.important ? "important " : "")
          }
        >
          <Toggle
            selectedList={selectedList}
            todo={todo}
            toggleFlag="completed"
          >
            {(toggle) => (
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={toggle}
              />
            )}
          </Toggle>
          <TodoContent
            endEdit={() => setCurrEditing(null)}
            isEditing={isEditing}
            selectedList={selectedList}
            todo={todo}
          />
          <DeleteTodo selectedList={selectedList} todo={todo}>
            {(deleteTodo) => <span onClick={deleteTodo}> Delete</span>}
          </DeleteTodo>
          <a
            onClick={() => {
              setCurrEditing(isEditing ? null : todo.id);
            }}
          >
            {isEditing ? " Cancel" : " Update"}
          </a>
          <a
            onClick={() => {
              setSelectedTodoId(isSelected ? null : todo.id);
            }}
          >
            {isSelected ? " Deselect" : " Select"}
          </a>
          <Toggle
            selectedList={selectedList}
            todo={todo}
            toggleFlag="important"
          >
            {(toggle) => (
              <a onClick={toggle} className="toggleImportant">
                {" "}
                Important
              </a>
            )}
          </Toggle>
          <span> {todo.order}</span>
        </StyledTodoListItem>
      )}
    </Draggable>
  );
}
