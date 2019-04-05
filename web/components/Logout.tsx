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
                // sign out from firebase
                await firebase.auth().signOut();
                // remove the API <-> CLIENT session token
                const response = await logout();
                // TODO: Remove the API <-> SSR session token
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
