import React from "react";
import { Mutation } from "react-apollo";
import { FETCH_LISTS } from "../other/queries";
import { UPDATE_LIST } from "../other/mutations";
import { TodoList, TodoListsQueryResult } from "./Main";

export interface ListVariables {
  name: string;
}

interface UpdateListProps {
  children: (
    updateListFn: (variables: ListVariables) => void
  ) => React.ReactNode;
  list: TodoList;
}

export default function UpdateList({ children, list }: UpdateListProps) {
  return (
    <Mutation
      ignoreResults
      mutation={UPDATE_LIST}
      update={(cache, { data: { updateList } }) => {
        const listsData: TodoListsQueryResult | null = cache.readQuery({
          query: FETCH_LISTS
        });
        if (listsData) {
          const { lists } = listsData;
          const index = listsData.lists.findIndex((l) => l.id === list.id);
          if (index >= 0) {
            const newLists = [
              ...lists.slice(0, index),
              {
                ...updateList,
                todos: list.todos
              },
              ...lists.slice(index + 1)
            ];
            cache.writeQuery({
              query: FETCH_LISTS,
              data: {
                lists: newLists
              }
            });
          }
        }
      }}
    >
      {(updateList) =>
        children((variables: ListVariables) => {
          updateList({
            variables: {
              ...variables,
              id: list.id
            },
            optimisticResponse: {
              __typename: "Mutation",
              updateList: {
                ...list,
                ...variables
              }
            }
          }).catch((error) => console.error(error));
        })
      }
    </Mutation>
  );
}
