import React, { useEffect, useRef, useState } from "react";
import { Mutation } from "react-apollo";
import Modal from "./Modal";
import { FETCH_LISTS } from "../other/queries";
import { UPDATE_LIST } from "../other/mutations";
import { TodoList, TodoListsQueryResult } from "./Main";

interface UpdateListModalProps {
  list: TodoList;
  closeModal: () => void;
}

export default function UpdateListModal({
  list,
  closeModal
}: UpdateListModalProps) {
  const [newListName, setNewListName] = useState(list.name);
  const newListNameInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (newListNameInput.current as HTMLInputElement).focus();
  }, []);

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
      {(updateList) => {
        return (
          <Modal closeModal={closeModal}>
            <div onClick={closeModal}>Close the modal</div>
            <form
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                updateList({
                  variables: {
                    id: list.id,
                    name: newListName
                  },
                  optimisticResponse: {
                    __typename: "Mutation",
                    updateList: {
                      ...list,
                      name: newListName
                    }
                  }
                }).catch((error) => console.error(error));
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
