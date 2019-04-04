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
import UpdateListModal from "./UpdateListModal";

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

interface UpdateListModalState {
  visible: boolean;
  list: TodoList | null;
}

export default function Main() {
  const [newListModalIsVisible, setNewListModalVisibility] = useState(false);
  const [updateListModalState, setUpdateListModalState] = useState<
    UpdateListModalState
  >({
    visible: false,
    list: null
  });

  const openNewListModal = () => {
    setNewListModalVisibility(true);
  };

  const openUpdateListModal = (list: TodoList) => {
    setUpdateListModalState({
      visible: true,
      list
    });
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
              openNewListModal={openNewListModal}
              openUpdateListModal={openUpdateListModal}
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
                      deleted
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
                      return {
                        lists: prev.lists.filter(
                          (list) => list.id !== deleted.id
                        )
                      };
                    }
                    // No need to explicitly handle 'updated'. Already works
                    // like magic. TODO: Why???????
                    // https://github.com/apollographql/apollo-client/issues/3480
                    return { lists: prev.lists };
                  }
                });
              }}
            />
            {newListModalIsVisible && (
              <CreateNewListModal
                closeModal={() => setNewListModalVisibility(false)}
                lists={lists}
              />
            )}
            {updateListModalState.list && updateListModalState.visible && (
              <UpdateListModal
                list={updateListModalState.list}
                closeModal={() =>
                  setUpdateListModalState({
                    visible: false,
                    list: null
                  })
                }
              />
            )}
          </StyledMain>
        );
      }}
    </Query>
  );
}
