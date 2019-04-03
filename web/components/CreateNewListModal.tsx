import React from "react";
import { Mutation } from "react-apollo";
import Modal from "./Modal";
import { FETCH_LISTS } from "../other/queries";
import { CREATE_LIST } from "../other/mutations";
import { TodoListsQueryResult, TodoList } from "./Main";
import * as crypto from "crypto";

interface CreateNewListModalProps {
  isVisible: boolean;
  lists: TodoList[];
  setVisibility: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function CreateNewListModal({
  isVisible,
  lists,
  setVisibility
}: CreateNewListModalProps) {
  return (
    <Mutation
      ignoreResults
      mutation={CREATE_LIST}
      update={(cache, { data: { createList } }) => {
        const listsData: TodoListsQueryResult | null = cache.readQuery({
          query: FETCH_LISTS
        });
        const lists = listsData ? listsData.lists : [];
        cache.writeQuery({
          query: FETCH_LISTS,
          data: {
            lists: lists.concat(createList)
          }
        });
      }}
    >
      {(createList) => {
        return (
          <Modal visible={isVisible} setVisibility={setVisibility}>
            <div onClick={() => setVisibility(false)}>Close the modal</div>
            <div
              onClick={() => {
                const randomName = crypto.randomBytes(8).toString("hex");
                createList({
                  variables: {
                    name: randomName
                  },
                  optimisticResponse: {
                    __typename: "Mutation",
                    createList: {
                      __typename: "List",
                      id: "temp",
                      name: randomName,
                      order: lists.length + 1,
                      todos: []
                    }
                  }
                }).catch((error) => console.error(error));
              }}
            >
              Call the mutation
            </div>
          </Modal>
        );
      }}
    </Mutation>
  );
}
