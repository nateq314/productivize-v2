import React, { useState } from "react";
import styled from "styled-components";
import { Todo, TodoList } from "./Main";
import TodoLists from "./TodoLists";
import Todos from "./Todos";
import TodoDetails from "./TodoDetails";

const StyledAppContent = styled.div`
  grid-area: app_content;
  display: grid;
  grid-template-columns: 25% 50% 25%;
  grid-template-areas: "lists todos details";
`;

interface AppContentProps {
  lists: TodoList[];
  toggleNewListModal: () => void;
}

export default function AppContent(props: AppContentProps) {
  const { lists, toggleNewListModal } = props;
  const [selectedListId, setSelectedListId] = useState(lists[0].id);
  const [selectedTodoId, setSelectedTodoId] = useState<string | undefined>();
  const selectedList = lists.find(
    (list) => selectedListId === list.id
  ) as TodoList;
  const { todos } = selectedList;

  return (
    <StyledAppContent>
      <TodoLists
        lists={lists}
        toggleNewListModal={toggleNewListModal}
        selectedList={selectedListId}
        setSelectedList={setSelectedListId}
      />
      <Todos
        todos={todos}
        selectedList={selectedList}
        selectedTodoId={selectedTodoId}
        setSelectedTodoId={setSelectedTodoId}
      />
      {selectedTodoId && (
        <TodoDetails
          selectedList={selectedList}
          todo={todos.find((t) => t.id === selectedTodoId) as Todo}
        />
      )}
    </StyledAppContent>
  );
}
