import React, { useContext, useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { TodoList, ListMember } from "./Main";
import { ListVariables } from "./UpdateList";
import { UserContext, User } from "../pages/_app";
import Button from "./Button";

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
  const user = useContext(UserContext) as User;
  const [newListName, setNewListName] = useState(list ? list.name : "");
  const [newMemberEmail, setNewMemberEmail] = useState("");
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
          // TODO: implement member addition
          // TODO: implement member deletion
          const newMembers = members
            .filter((m) => m.user.id.startsWith("temp-"))
            .map((m) => m.user.email);
          const variables: ListVariables = { name: newListName };
          if (newMembers.length > 0) variables.newMembers = newMembers;
          createOrUpdateList(variables);
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
        <input
          placeholder="Email address"
          value={newMemberEmail}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setNewMemberEmail(e.target.value)
          }
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              // TODO: input validation
              if (!members.map((m) => m.user.email).includes(newMemberEmail)) {
                setMembers(
                  members.concat({
                    is_admin: false,
                    pending_acceptance: true,
                    user: {
                      id: `temp-${Date.now()}`,
                      email: newMemberEmail,
                      first_name: "",
                      last_name: ""
                    }
                  })
                );
                setNewMemberEmail("");
              }
            }
          }}
        />
        {members.map((member) => {
          const isTemp = member.user.id.startsWith("temp-");
          return (
            <div key={member.user.id}>
              {!isTemp && `${member.user.first_name} ${member.user.last_name}`}(
              {member.user.email}){member.is_admin ? " (owner)" : ""}
              {member.pending_acceptance ? " (pending)" : ""}
            </div>
          );
        })}
        <button type="submit">Submit</button>
      </form>
    </Modal>
  );
}
