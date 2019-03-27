import React, { useState } from "react";
import styled from "styled-components";
import { TodoList } from "./Main";
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

export default function AppContent({
  lists,
  toggleNewListModal
}: AppContentProps) {
  const [selectedList, setSelectedList] = useState(lists[0].id);
  const { todos } = lists.find((list) => selectedList === list.id) as TodoList;

  return (
    <StyledAppContent>
      <TodoLists
        lists={lists}
        toggleNewListModal={toggleNewListModal}
        selectedList={selectedList}
        setSelectedList={setSelectedList}
      />
      <Todos todos={todos} />
      <TodoDetails />
    </StyledAppContent>
  );
}
