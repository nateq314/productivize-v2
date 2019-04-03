import React, { useEffect, useRef, useState } from "react";
import { Mutation } from "react-apollo";
import Modal from "./Modal";
import { FETCH_LISTS } from "../other/queries";
import { CREATE_LIST } from "../other/mutations";
import { TodoListsQueryResult, TodoList } from "./Main";

interface CreateNewListModalProps {
  isVisible: boolean;
  lists: TodoList[];
  closeModal: () => void;
}

export default function CreateNewListModal({
  isVisible,
  lists,
  closeModal
}: CreateNewListModalProps) {
  const [newListName, setNewListName] = useState("");
  const newListNameInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible) {
      (newListNameInput.current as HTMLInputElement).focus();
    }
  }, [isVisible]);

  return (
    <Mutation
      ignoreResults
      mutation={CREATE_LIST}
      update={(cache, { data: { createList } }) => {
        // update() will still get called when the mutation result comes back,
        // but we choose to only handle the initial (optimistic) update, and
        // save the real update for the subscription handler. Hopefully this
        // will reduce the likelihood of a data race.
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
          <Modal visible={isVisible} closeModal={closeModal}>
            <div onClick={closeModal}>Close the modal</div>
            <form
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                createList({
                  variables: {
                    name: newListName
                  },
                  optimisticResponse: {
                    __typename: "Mutation",
                    createList: {
                      __typename: "List",
                      id: "temp",
                      name: newListName,
                      order: lists.length + 1,
                      todos: []
                    }
                  }
                }).catch((error) => console.error(error));
                setNewListName("");
                closeModal();
              }}
            >
              <input
                ref={newListNameInput}
                value={newListName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewListName(e.target.value)
                }
              />
            </form>
          </Modal>
        );
      }}
    </Mutation>
  );
}
