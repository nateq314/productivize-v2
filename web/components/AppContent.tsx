import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { TodoList } from "./Main";
import ListsPane from "./ListsPane/ListsPane";
import TodosPane from "./TodosPane/TodosPane";
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
  const [selectedListIds, setSelectedListIds] = useState([lists[0].id]);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  // filter out undefined lists, e.g. in the case where
  // one of the selected lists got deleted
  const selectedLists = selectedListIds
    .map((listId) => lists.find((l) => listId === l.id))
    .filter((list) => list) as TodoList[];
  const selectedTodo = selectedTodoId
    ? selectedLists
        .map((l) => l.todos)
        .reduce((allTodos, currTodos) => allTodos.concat(currTodos))
        .find((todo) => todo.id === selectedTodoId)
    : undefined;

  if (selectedLists.length === 0) {
    // Only one list was selected, and it got deleted. It's okay to do the
    // below since it's guaranteed that there will always be at least one list.
    setSelectedListIds([lists[0].id]);
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
        selectedListIds={selectedListIds}
        setSelectedListIds={(ids: string[]) => {
          setSelectedListIds(ids);
          if (selectedTodo && !ids.includes(selectedTodo.list_id)) {
            setSelectedTodoId(null);
          }
        }}
      />
      <TodosPane
        selectedLists={selectedLists}
        selectedTodoId={selectedTodoId}
        setSelectedTodoId={setSelectedTodoId}
      />
      {selectedTodo && <TodoDetails todo={selectedTodo} />}
    </StyledAppContent>
  );
}
