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
  added_on: string;
  completed: boolean;
  completed_on: string | null;
  content: string;
  deadline: string | null;
  description: string;
  important: boolean;
  remind_on: string | null;
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
