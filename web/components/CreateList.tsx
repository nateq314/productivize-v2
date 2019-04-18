import React, { useContext } from "react";
import { Mutation } from "react-apollo";
import { FETCH_LISTS } from "../other/queries";
import { CREATE_LIST } from "../other/mutations";
import { TodoListsQueryResult } from "./Main";
import { UserContext, StoredUserData } from "../pages/_app";

interface CreateListVariables {
  name: string;
}

interface CreateListProps {
  children: (
    createListFn: (variables: CreateListVariables) => void
  ) => React.ReactNode;
}

export default function CreateList({ children }: CreateListProps) {
  // okay to cast since this component could never get rendered
  // without user being logged in in the first place
  const user = useContext(UserContext) as StoredUserData;

  return (
    <Mutation
      ignoreResults
      mutation={CREATE_LIST}
      update={(cache, { data: { createList } }) => {
        const listsData: TodoListsQueryResult | null = cache.readQuery({
          query: FETCH_LISTS
        });
        const lists = listsData ? listsData.lists : [];
        // order === -1 for optimistic update only
        if (createList.order === -1) createList.order = lists.length + 1;
        cache.writeQuery({
          query: FETCH_LISTS,
          data: {
            lists: lists.concat(createList)
          }
        });
      }}
    >
      {(createList) =>
        children((variables: CreateListVariables) => {
          createList({
            variables,
            optimisticResponse: {
              __typename: "Mutation",
              createList: {
                __typename: "List",
                id: "temp",
                name: variables.name,
                order: -1,
                members: [
                  {
                    __typename: "ListMember",
                    is_admin: true,
                    pending_acceptance: false,
                    user
                  }
                ],
                todos: []
              }
            }
          }).catch((error) => console.error(error));
        })
      }
    </Mutation>
  );
}
