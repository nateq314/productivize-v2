import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Todo, TodoList } from "./Main";
import ListsPane from "./ListsPane";
import TodosPane from "./TodosPane";
import TodoDetails from "./TodoDetails";

const StyledAppContent = styled.div`
  grid-area: app_content;
  display: grid;
  grid-template-columns: 25% 50% 25%;
  grid-template-areas: "lists todos details";
`;

interface AppContentProps {
  lists: TodoList[];
  subscribeToListEvents: () => () => void;
  openNewListModal: () => void;
  openUpdateListModal: (list: TodoList) => void;
}

export default function AppContent(props: AppContentProps) {
  const {
    lists,
    subscribeToListEvents,
    openNewListModal,
    openUpdateListModal
  } = props;
  const [selectedListId, setSelectedListId] = useState(lists[0].id);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const selectedList = lists.find(
    (list) => selectedListId === list.id
  ) as TodoList;
  const todos = selectedList ? selectedList.todos : [];
  const selectedTodo = todos.find((t) => t.id === selectedTodoId) as Todo;

  if (!selectedList) {
    // The list that was selected got deleted. It's okay to do the below since
    // it's guaranteed that there will always be at least one list.
    setSelectedListId(lists[0].id);
    setSelectedTodoId(null);
  }

  if (selectedTodoId && !selectedTodo) {
    // The todo that was selected got deleted.
    setSelectedTodoId(null);
  }

  // note this returns the unsubscribe function, to be called at component unmount
  // TODO: unsubscribe() below won't get run on logout or closing browser tab or
  // direct navigation to another url, because those don't involve unmounting the
  // component. So need to find an appropriate place to call this.
  useEffect(() => {
    console.log("about to subscribe");
    const unsubscribe = subscribeToListEvents();
    return () => {
      console.log("about to unsubscribe");
      unsubscribe();
    };
  }, []);

  return (
    <StyledAppContent>
      <ListsPane
        lists={lists}
        openNewListModal={openNewListModal}
        openUpdateListModal={openUpdateListModal}
        selectedList={selectedListId}
        setSelectedList={(id: string) => {
          setSelectedListId(id);
          setSelectedTodoId(null);
        }}
      />
      <TodosPane
        todos={todos}
        selectedList={selectedList}
        selectedTodoId={selectedTodoId}
        setSelectedTodoId={setSelectedTodoId}
      />
      {selectedTodoId && (
        <TodoDetails selectedList={selectedList} todo={selectedTodo} />
      )}
    </StyledAppContent>
  );
}
