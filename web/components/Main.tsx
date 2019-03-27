import React, { useState } from "react";
import { Query } from "react-apollo";
import styled from "styled-components";
import AppBar from "./AppBar";
import AppContent from "./AppContent";
import CreateNewListModal from "./CreateNewListModal";
import { FETCH_LISTS } from "../other/queries";

const StyledMain = styled.div`
  height: 100vh;
  display: grid;
  grid-template-rows: 70px auto;
  grid-template-areas: "appbar" "app_content";
`;

export interface TodoListsQueryResult {
  lists: TodoList[];
}

export interface TodoList {
  id: string;
  name: string;
  order: number;
  todos: Todo[];
}

export interface Todo {
  id: string;
  content: string;
}

export default function Main() {
  const [newListModalIsVisible, setNewListModalVisibility] = useState(false);

  const toggleNewListModal = () => {
    setNewListModalVisibility(!newListModalIsVisible);
  };

  return (
    <Query query={FETCH_LISTS}>
      {({ loading, error, data }) => {
        if (loading) return "Loading...";
        if (error) return `Error! ${error.message}`;

        // returned data actually contains the todos nested into each list.
        // But we want to pass only the lists themselves to <TodoLists />,
        // and only the todos for the currently selected list to <Todo />.
        // So separate them out here.
        const lists: TodoList[] = (data as TodoListsQueryResult).lists;

        return (
          <StyledMain>
            <AppBar />
            <AppContent toggleNewListModal={toggleNewListModal} lists={lists} />
            <CreateNewListModal
              isVisible={newListModalIsVisible}
              setVisibility={setNewListModalVisibility}
            />
          </StyledMain>
        );
      }}
    </Query>
  );
}
