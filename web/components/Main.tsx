import React, { useState } from "react";
import { Query } from "react-apollo";
import styled from "styled-components";
import AppBar from "./AppBar";
import AppContent from "./AppContent";
import CreateNewListModal from "./CreateListModal";
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

interface ListMember {
  is_admin: boolean;
  pending_acceptance: boolean;
  user: any; // TODO: type this
}

export interface TodoList {
  id: string;
  name: string;
  order: number;
  members: ListMember[];
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
  order: number;
  remind_on: string | null;
}

interface UpdateListModalState {
  visible: boolean;
  list: TodoList | null;
}

export default function Main() {
  const [newListModalIsVisible, setNewListModalVisibility] = useState(false);
  const [updateListModalState, setUpdateListModalState] = useState({
    visible: false,
    list: null
  } as UpdateListModalState);

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
              // subscribeToMore() returns an unsubscribe function
              subscribeToListEvents={() =>
                subscribeToMore({
                  document: LIST_EVENTS_SUBSCRIPTION,
                  updateQuery
                })
              }
            />
            {newListModalIsVisible && (
              <CreateNewListModal
                closeModal={() => setNewListModalVisibility(false)}
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

function updateQuery(
  prev: TodoListsQueryResult,
  { subscriptionData }: ListEventsSubscriptionData
): TodoListsQueryResult {
  if (!subscriptionData.data) return prev;
  const {
    listCreated,
    listDeleted,
    listUpdated,
    todoCreated,
    todoDeleted,
    todoUpdated,
    metadata
  } = subscriptionData.data.listEvents;
  if (todoCreated) {
    const listIndex = prev.lists.findIndex(
      (list) => list.id === todoCreated.list_id
    );
    if (listIndex >= 0) {
      // If the list exists
      const todoIndex = prev.lists[listIndex].todos.findIndex(
        (todo) => todo.id === todoCreated.id
      );
      if (todoIndex === -1) {
        // If the todo does NOT exist
        const updatedList = {
          ...prev.lists[listIndex],
          todos: prev.lists[listIndex].todos.concat(todoCreated)
        };
        return {
          lists: [
            ...prev.lists.slice(0, listIndex),
            updatedList,
            ...prev.lists.slice(listIndex + 1)
          ]
        };
      }
    }
    return { lists: prev.lists };
  } else if (todoDeleted) {
    const listIndex = prev.lists.findIndex(
      (list) => list.id === todoDeleted.list_id
    );
    if (listIndex >= 0) {
      // If the list exists
      const todoIndex = prev.lists[listIndex].todos.findIndex(
        (todo) => todo.id === todoDeleted.id
      );
      if (todoIndex >= 0) {
        // If the todo still exists
        const deletedTodoOrder = prev.lists[listIndex].todos[todoIndex].order;
        const updatedList = {
          ...prev.lists[listIndex],
          todos: [
            ...prev.lists[listIndex].todos.slice(0, todoIndex),
            ...prev.lists[listIndex].todos.slice(todoIndex + 1)
          ].map((t) => {
            return t.order > deletedTodoOrder
              ? {
                  ...t,
                  order: t.order - 1
                }
              : t;
          })
        };
        return {
          lists: [
            ...prev.lists.slice(0, listIndex),
            updatedList,
            ...prev.lists.slice(listIndex + 1)
          ]
        };
      }
    }
    return { lists: prev.lists };
  } else if (todoUpdated) {
    // Whatever the update is, it's already been updated in the cache by the
    // time we get here. So here we only care about updates that have side
    // effects. E.g. order.
    if (metadata) {
      const listIndex = prev.lists.findIndex(
        (list) => list.id === todoUpdated.list_id
      );
      const { prevOrder } = metadata;
      const newOrder = todoUpdated.order;
      // We only want to return anything if we know that all other todo orders
      // (besides the one updated) have not yet been updated. If such is the case,
      // then there will be exactly two todo items with order === newOrder.
      if (
        prev.lists[listIndex].todos.filter((t) => t.order === newOrder)
          .length === 2
      ) {
        return {
          lists: [
            ...prev.lists.slice(0, listIndex),
            {
              ...prev.lists[listIndex],
              todos:
                newOrder > prevOrder
                  ? // If the order INCREASED
                    prev.lists[listIndex].todos.map((t) => {
                      if (t.id === todoUpdated.id) {
                        return todoUpdated;
                      } else if (t.order <= newOrder && t.order > prevOrder) {
                        // decrement all todos with order such that
                        // prevOrder < order <= newOrder
                        return {
                          ...t,
                          order: t.order - 1
                        };
                      } else return t;
                    })
                  : // If the order DECREASED
                    prev.lists[listIndex].todos.map((t) => {
                      if (t.id === todoUpdated.id) {
                        return todoUpdated;
                      } else if (t.order >= newOrder && t.order < prevOrder) {
                        // increment all todos with order such that
                        // newOrder <= order < prevOrder
                        return {
                          ...t,
                          order: t.order + 1
                        };
                      } else return t;
                    })
            },
            ...prev.lists.slice(listIndex + 1)
          ]
        };
      }
    }
  } else if (listCreated) {
    const index = prev.lists.findIndex(
      (list) => list.id === listCreated.id || list.id === "temp"
    );
    return index >= 0
      ? // Already added
        {
          lists: [
            ...prev.lists.slice(0, index),
            listCreated,
            ...prev.lists.slice(index + 1)
          ]
        }
      : // Or this could be another terminal
        {
          lists: prev.lists.concat(listCreated)
        };
  } else if (listDeleted) {
    return {
      lists: prev.lists.filter((list) => list.id !== listDeleted.id)
    };
  } else if (listUpdated) {
    if (metadata) {
      const { prevOrder } = metadata;
      const newOrder = listUpdated.order;
      if (prev.lists.filter((l) => l.order === newOrder).length === 2) {
        return {
          lists:
            newOrder > prevOrder
              ? // If the order INCREASED
                prev.lists.map((l) => {
                  if (l.id === listUpdated.id)
                    return {
                      ...listUpdated,
                      todos: l.todos
                    };
                  else if (l.order <= newOrder && l.order > prevOrder) {
                    // decrement all todos with order such that
                    // prevOrder < order <= newOrder
                    return {
                      ...l,
                      order: l.order - 1
                    };
                  } else return l;
                })
              : // If the order DECREASED
                prev.lists.map((l) => {
                  if (l.id === listUpdated.id)
                    return {
                      ...listUpdated,
                      todos: l.todos
                    };
                  else if (l.order >= newOrder && l.order < prevOrder) {
                    // increment all todos with order such that
                    // newOrder <= order < prevOrder
                    return {
                      ...l,
                      order: l.order + 1
                    };
                  } else return l;
                })
        };
      }
    }
  }
  // No need to explicitly handle 'listUpdated' or 'todoUpdated'.
  // Already works like magic. TODO: Why???????
  // https://github.com/apollographql/apollo-client/issues/3480
  return { lists: prev.lists };
}
