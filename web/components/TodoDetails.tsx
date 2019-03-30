import React from "react";
import styled from "styled-components";
import { Todo, TodoList } from "./Main";
import Toggle from "./Toggle";
import TodoContent from "./TodoContent";
import TodoDescription from "./TodoDescription";
import TodoDeadline from "./TodoDeadline";

const StyledTodoDetails = styled.section`
  grid-area: details;
  border-left: 1px solid #333;
  background-color: #191919;
  padding: 20px;

  header {
    margin-bottom: 30px;
  }

  &.important {
    .toggleImportant {
      background-color: #f00;
    }
  }
`;

interface TodoDetailsProps {
  selectedList: TodoList;
  todo: Todo;
}

export default function TodoDetails(props: TodoDetailsProps) {
  const { selectedList, todo } = props;

  return (
    <StyledTodoDetails className={todo.important ? "important " : ""}>
      <header>
        <Toggle selectedList={selectedList} todo={todo} toggleFlag="completed">
          {(toggle) => (
            <input type="checkbox" checked={todo.completed} onChange={toggle} />
          )}
        </Toggle>
        <TodoContent
          endEdit={() => {}}
          isEditing={false}
          selectedList={selectedList}
          todo={todo}
        />
        <Toggle selectedList={selectedList} todo={todo} toggleFlag="important">
          {(toggle) => (
            <a onClick={toggle} className="toggleImportant">
              Important
            </a>
          )}
        </Toggle>
      </header>
      <TodoDeadline todo={todo} />
      <h4>Description</h4>
      <TodoDescription selectedListId={selectedList.id} todo={todo} />
    </StyledTodoDetails>
  );
}
