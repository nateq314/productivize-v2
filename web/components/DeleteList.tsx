import React from "react";
import { Mutation } from "react-apollo";
import { DELETE_LIST } from "../other/mutations";
import { TodoListsQueryResult, TodoList } from "./Main";
import { FETCH_LISTS } from "../other/queries";

interface DeleteListProps {
  children: (configuredMutationFn: () => void) => React.ReactNode;
  list: TodoList;
}

const optimisticResponse = {
  __typename: "Mutation",
  deleteList: {
    __typename: "Result",
    success: true,
    message: null
  }
};

export default function DeleteList({ children, list }: DeleteListProps) {
  return (
    <Mutation
      mutation={DELETE_LIST}
      optimisticResponse={optimisticResponse}
      update={(cache, { data }) => {
        if (data) {
          const {
            deleteList: { success }
          } = data;
          const listsData: TodoListsQueryResult | null = cache.readQuery({
            query: FETCH_LISTS
          });
          if (success && listsData) {
            const { lists } = listsData;
            cache.writeQuery({
              query: FETCH_LISTS,
              data: {
                lists: lists
                  .filter((l) => l.id !== list.id)
                  .map((l) => ({
                    ...l,
                    order: l.order > list.order ? l.order - 1 : l.order
                  }))
              }
            });
          }
        }
      }}
    >
      {(deleteList) =>
        children(() => {
          deleteList({
            variables: {
              id: list.id
            }
          });
        })
      }
    </Mutation>
  );
}
