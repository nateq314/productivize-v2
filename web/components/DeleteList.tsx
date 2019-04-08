import React from "react";
import { Mutation } from "react-apollo";
import { DELETE_LIST } from "../other/mutations";
import { TodoList } from "./Main";
import { FETCH_LISTS } from "../other/queries";

interface DeleteListProps {
  children: (configuredMutationFn: () => void) => React.ReactNode;
  lists: TodoList[];
  listId: string;
}

const optimisticResponse = {
  __typename: "Mutation",
  deleteList: {
    __typename: "Result",
    success: true,
    message: null
  }
};

export default function DeleteList({
  children,
  lists,
  listId
}: DeleteListProps) {
  return (
    <Mutation
      mutation={DELETE_LIST}
      optimisticResponse={optimisticResponse}
      update={(cache, { data }) => {
        if (data) {
          const {
            deleteList: { success }
          } = data;
          if (success) {
            cache.writeQuery({
              query: FETCH_LISTS,
              data: {
                lists: lists.filter((list) => list.id !== listId)
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
              id: listId
            }
          });
        })
      }
    </Mutation>
  );
}
