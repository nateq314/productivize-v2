import React from "react";
import styled from "styled-components";
import { Todo, TodoList } from "./Main";
import Toggle from "./Toggle";
import TodoContent from "./TodoContent";
import DeleteTodo from "./DeleteTodo";

const StyledTodoListItem = styled.li`
  margin-bottom: 20px;

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
  isEditing: boolean;
  isSelected: boolean;
  selectedList: TodoList;
  setCurrEditing: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedTodoId: React.Dispatch<React.SetStateAction<string | null>>;
  todo: Todo;
}

export default function TodoListItem({
  isEditing,
  isSelected,
  selectedList,
  setCurrEditing,
  setSelectedTodoId,
  todo
}: TodoListItemProps) {
  return (
    <StyledTodoListItem
      className={
        (isSelected ? `selected ` : "") + (todo.important ? "important " : "")
      }
    >
      <Toggle selectedList={selectedList} todo={todo} toggleFlag="completed">
        {(toggle) => (
          <input type="checkbox" checked={todo.completed} onChange={toggle} />
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
        {isEditing ? "Cancel" : "Update"}
      </a>
      <a
        onClick={() => {
          setSelectedTodoId(isSelected ? null : todo.id);
        }}
      >
        {isSelected ? "Deselect" : "Select"}
      </a>
      <Toggle selectedList={selectedList} todo={todo} toggleFlag="important">
        {(toggle) => (
          <a onClick={toggle} className="toggleImportant">
            Important
          </a>
        )}
      </Toggle>
    </StyledTodoListItem>
  );
}
