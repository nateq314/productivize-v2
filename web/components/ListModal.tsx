import React, { useContext, useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { TodoList, ListMember } from "./Main";
import { ListVariables } from "./UpdateList";
import { UserContext } from "../pages/_app";

interface ListModalProps {
  list?: TodoList; // present for UPDATE modal, not present for CREATE modal
  closeModal: () => void;
  createOrUpdateList: (variables: ListVariables) => void;
}

export default function ListModal({
  createOrUpdateList,
  list,
  closeModal
}: ListModalProps) {
  const user = useContext(UserContext);
  const [newListName, setNewListName] = useState(list ? list.name : "");
  const [members, setMembers] = useState<ListMember[]>(
    list
      ? list.members
      : [
          {
            is_admin: true,
            pending_acceptance: false,
            user
          }
        ]
  );
  const newListNameInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (newListNameInput.current as HTMLInputElement).focus();
  }, []);

  return (
    <Modal closeModal={closeModal}>
      <div onClick={closeModal}>Close the modal</div>
      <form
        onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          createOrUpdateList({ name: newListName });
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
        {members.map((member) => (
          <div key={member.user.id}>{member.user.id}</div>
        ))}
      </form>
    </Modal>
  );
}
