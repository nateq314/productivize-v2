import React, { useState } from "react";
import { Query } from "react-apollo";
import styled from "styled-components";
import AppBar from "./AppBar";
import AppContent from "./AppContent";
import CreateNewListModal from "./CreateNewListModal";
import { FETCH_LISTS } from "../other/queries";
import {
  LIST_EVENTS_SUBSCRIPTION,
  ListEventsSubscriptionData
} from "../other/subscriptions";

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
  list_id: string;
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
      {({ loading, error, data, subscribeToMore }) => {
        if (loading) return "Loading...";
        if (error) return `Error! ${error.message}`;

        const lists: TodoList[] = (data as TodoListsQueryResult).lists;

        return (
          <StyledMain>
            <AppBar />
            <AppContent
              toggleNewListModal={toggleNewListModal}
              lists={lists}
              subscribeToListEvents={() => {
                // subscribeToMore() returns an unsubscribe function
                return subscribeToMore({
                  document: LIST_EVENTS_SUBSCRIPTION,
                  updateQuery: (
                    prev: TodoListsQueryResult,
                    { subscriptionData }: ListEventsSubscriptionData
                  ): TodoListsQueryResult => {
                    if (!subscriptionData.data) return prev;
                    const {
                      created,
                      deleted,
                      updated
                    } = subscriptionData.data.listEvents;
                    if (created) {
                      const index = prev.lists.findIndex(
                        (list) => list.id === created.id || list.id === "temp"
                      );
                      return index >= 0
                        ? // Already added
                          {
                            lists: [
                              ...prev.lists.slice(0, index),
                              created,
                              ...prev.lists.slice(index + 1)
                            ]
                          }
                        : // Or this could be another terminal
                          {
                            lists: prev.lists.concat(created)
                          };
                    } else if (deleted) {
                      console.log("deleted:", deleted);
                      return {
                        lists: prev.lists.filter(
                          (list) => list.id !== deleted.id
                        )
                      };
                    } else if (updated) {
                      return {
                        lists: prev.lists.map((list) =>
                          list.id === updated.id
                            ? {
                                ...list,
                                ...updated
                              }
                            : list
                        )
                      };
                    } else {
                      console.error(
                        "Data subscription error. Received subscription data" +
                          "but it wasn't in the expected shape. Received:",
                        subscriptionData.data
                      );
                      return prev;
                    }
                  }
                });
              }}
            />
            <CreateNewListModal
              isVisible={newListModalIsVisible}
              closeModal={() => setNewListModalVisibility(false)}
              lists={lists}
            />
          </StyledMain>
        );
      }}
    </Query>
  );
}
