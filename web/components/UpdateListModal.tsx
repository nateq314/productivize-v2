import React, { useEffect, useRef, useState } from "react";
import { Mutation } from "react-apollo";
import Modal from "./Modal";
import { TodoList } from "./Main";
import UpdateList from "./UpdateList";

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
    <UpdateList list={list}>
      {(updateList) => {
        return (
          <Modal closeModal={closeModal}>
            <div onClick={closeModal}>Close the modal</div>
            <form
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                updateList({ name: newListName });
                closeModal();
              }}
            >
              <h5>Name:</h5>
              <input
                ref={newListNameInput}
                value={newListName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewListName(e.target.value)
                }
              />
              <h5>Owners</h5>
              {list.members.map(member => (
                <div key={member.user.id}>{member.user.id}</div>
              ))}
            </form>
          </Modal>
        );
      }}
    </UpdateList>
  );
}
