import React, { useContext } from "react";
import styled from "styled-components";
import firebase from "../other/firebase";
import { Mutation } from "react-apollo";
import { UserContext } from "../pages/_app";
import { LOGOUT } from "../other/mutations";

const StyledLogout = styled.span``;

function Login() {
  const user = useContext(UserContext);
  return (
    <StyledLogout>
      {user ? (
        <Mutation mutation={LOGOUT}>
          {(logout) => (
            <button
              onClick={async () => {
                await firebase.auth().signOut();
                const response = await logout();
                console.log("logout response:", response);
                location.assign(`${location.href}?logout=true`);
              }}
            >
              Log Out
            </button>
          )}
        </Mutation>
      ) : null}
    </StyledLogout>
  );
}

export default Login;
