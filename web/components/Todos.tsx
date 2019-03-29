import React, { useState } from "react";
import styled from "styled-components";
import { Todo, TodoList } from "./Main";
import CreateNewTodo from "./CreateNewTodo";
import DeleteTodo from "./DeleteTodo";
import TodoContent from "./TodoContent";
import CompletedCheckbox from "./CompletedCheckbox";

const StyledTodos = styled.section`
  grid-area: todos;

  ul {
    list-style-type: none;
  }

  li.selected {
    background-color: #555;
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
            <li key={todo.id} className={isSelected ? `selected` : ""}>
              <CompletedCheckbox selectedList={selectedList} todo={todo} />
              <TodoContent
                endEdit={() => setCurrEditing(null)}
                isEditing={isEditing}
                selectedList={selectedList}
                todo={todo}
              />
              <DeleteTodo selectedList={selectedList} todo={todo} />
              <a
                onClick={() => {
                  setCurrEditing(isEditing ? null : todo.id);
                }}
              >
                {isEditing ? "Cancel" : "Update"}
              </a>
              <a
                onClick={() => {
                  setSelectedTodoId(isSelected ? undefined : todo.id);
                }}
              >
                {isSelected ? "Deselect" : "Select"}
              </a>
            </li>
          );
        })}
      </ul>
    </StyledTodos>
  );
}
