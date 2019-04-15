import React from "react";
import styled from "styled-components";
import { Todo } from "./Main";
import Toggle from "./Toggle";
import TodoContent from "./TodoContent";
import TodoDescription from "./TodoDescription";
import TodoDateTimeInput from "./TodoDateTimeInput";

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
  todo: Todo;
}

export default function TodoDetails(props: TodoDetailsProps) {
  const { todo } = props;

  return (
    <StyledTodoDetails className={todo.important ? "important " : ""}>
      <header>
        <Toggle todo={todo} toggleFlag="completed">
          {(toggle) => (
            <input type="checkbox" checked={todo.completed} onChange={toggle} />
          )}
        </Toggle>
        <TodoContent endEdit={() => {}} isEditing={false} todo={todo} />
        <Toggle todo={todo} toggleFlag="important">
          {(toggle) => (
            <a onClick={toggle} className="toggleImportant">
              Important
            </a>
          )}
        </Toggle>
      </header>
      <div className="deadline">
        <TodoDateTimeInput
          field="deadline"
          placeholder="Set due date"
          todo={todo}
        />
      </div>
      <div className="remind_on">
        <TodoDateTimeInput
          field="remind_on"
          includeTime
          placeholder="Remind me"
          todo={todo}
        />
      </div>
      <h4>Description</h4>
      <TodoDescription todo={todo} />
    </StyledTodoDetails>
  );
}
