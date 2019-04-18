import React, { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import CreateList from "./CreateList";

interface CreateListModalProps {
  closeModal: () => void;
}

export default function CreateListModal({ closeModal }: CreateListModalProps) {
  const [newListName, setNewListName] = useState("");
  const newListNameInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (newListNameInput.current as HTMLInputElement).focus();
  }, []);

  return (
    <CreateList>
      {(createList) => {
        return (
          <Modal closeModal={closeModal}>
            <div onClick={closeModal}>Close the modal</div>
            <form
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                createList({ name: newListName });
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
    </CreateList>
  );
}
