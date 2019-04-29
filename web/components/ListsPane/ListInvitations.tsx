import React, { useContext } from 'react';
import styled from 'styled-components';
import { UserContext, User } from '../../pages/_app';

const StyledListInvitations = styled.div`
  grid-area: invitations;
`;

export default function ListInvitations() {
  const user = useContext(UserContext) as User;

  return (
    <StyledListInvitations>
      {user.list_invitations.map((list) => (
        <div key={`inv-${list.id}`} className="invitation">
          {list.name}
          <br />
          from {list.admin.first_name} {list.admin.last_name}
        </div>
      ))}
    </StyledListInvitations>
  );
}
