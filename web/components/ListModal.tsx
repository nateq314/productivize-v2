import React, { useContext, useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import { TodoList, ListMember } from './Main';
import { ListVariables } from './UpdateList';
import { UserContext, User } from '../pages/_app';

interface ListModalProps {
  list?: TodoList; // present for UPDATE modal, not present for CREATE modal
  closeModal: () => void;
  createOrUpdateList: (variables: ListVariables) => void;
}

export default function ListModal({ createOrUpdateList, list, closeModal }: ListModalProps) {
  const user = useContext(UserContext) as User;
  const [newListName, setNewListName] = useState(list ? list.name : '');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [members, _setMembers] = useState<ListMember[]>(list ? list.members : []);
  const [pendingMembers, setPendingMembers] = useState<string[]>(
    list ? list.pending_members : [user.email],
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
          const variables: ListVariables = { name: newListName };
          if (pendingMembers.length > 0) variables.newMembers = pendingMembers;
          createOrUpdateList(variables);
          closeModal();
        }}
      >
        <h5>Name:</h5>
        <input
          ref={newListNameInput}
          value={newListName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewListName(e.target.value)}
        />
        <h5>Owners</h5>
        <input
          placeholder="Email address"
          value={newMemberEmail}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMemberEmail(e.target.value)}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
          onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              // TODO: input validation
              if (!members.map((m) => m.user.email).includes(newMemberEmail)) {
                setPendingMembers(pendingMembers.concat(newMemberEmail));
                setNewMemberEmail('');
              }
            }
          }}
        />
        {members.map((member) => (
          <div key={member.user.id}>
            {member.user.first_name} {member.user.last_name} ({member.user.email})
            {member.is_admin ? ' (owner)' : ''}
          </div>
        ))}
        {pendingMembers.map((pendingMember) => (
          <div key={pendingMember}>{pendingMember}</div>
        ))}
        <button type="submit">Submit</button>
      </form>
    </Modal>
  );
}
