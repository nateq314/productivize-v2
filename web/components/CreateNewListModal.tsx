import React from "react";
import { Mutation } from "react-apollo";
import Modal from "./Modal";
import { CREATE_LIST, FETCH_LISTS } from "../other/queries";
import { TodoListsQueryResult } from "./Main";
import * as crypto from "crypto";

interface CreateNewListModalProps {
  isVisible: boolean;
  setVisibility: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function CreateNewListModal({
  isVisible,
  setVisibility
}: CreateNewListModalProps) {
  return (
    <Mutation
      mutation={CREATE_LIST}
      update={(cache, { data: { createList } }) => {
        console.log("<CreateNewList /> mutation update()");
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
              onClick={() =>
                createList({
                  variables: {
                    name: crypto.randomBytes(8).toString("hex")
                  }
                }).catch((error) => console.error(error))
              }
            >
              Call the mutation
            </div>
          </Modal>
        );
      }}
    </Mutation>
  );
}
