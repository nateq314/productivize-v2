import React, { useRef } from 'react';
import styled from 'styled-components';
import firebase, { auth } from '../other/firebase';
import { Mutation, FetchResult } from 'react-apollo';
import gql from 'graphql-tag';
import * as Cookies from 'cookies-js';

interface LoginResponse {
  error?: string;
  user?: firebase.User;
}

const StyledLogin = styled.div``;

export const LOGIN = `
  mutation Login($idToken: String, $session: String) {
    login(idToken: $idToken, session: $session) {
      error
      user {
        id
        email
        first_name
        last_name
        list_invitations {
          id
          name
          admin {
            id
            first_name
            last_name
            email
          }
        }
      }
    }
  }
`;

/**
 * <Login /> intentionally does not handle the case of no user object.
 * So it should only ever be rendered in the context of no user.
 */
function Login() {
  const email = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);

  return (
    <Mutation mutation={gql(LOGIN)}>
      {(login) => {
        return (
          <StyledLogin>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const { user } = await firebase
                  .auth()
                  .signInWithEmailAndPassword(
                    (email.current as HTMLInputElement).value,
                    (password.current as HTMLInputElement).value,
                  );
                // TODO: is login fail handled correctly here?
                if (user) {
                  let idToken = await user.getIdToken();
                  // Only purpose of this call is to set the session cookie, not to get the user object
                  let response: void | FetchResult<any, Record<string, any>, Record<string, any>>;
                  try {
                    response = await login({
                      variables: { idToken },
                    });
                  } catch (error) {
                    const credential = auth.EmailAuthProvider.credential(
                      (email.current as HTMLInputElement).value,
                      (password.current as HTMLInputElement).value,
                    );
                    const result = await user.reauthenticateWithCredential(credential);
                    console.log('re-authentication result:', result);
                    idToken = await user.getIdToken();
                    response = await login({
                      variables: { idToken },
                    });
                  }
                  if (response) {
                    console.log('response:', response);
                    const { error } = response.data.login as LoginResponse;
                    if (error) {
                      console.error(error);
                    } else {
                      const { user } = response as any;
                      // Then we know the API cookie has been set.
                      // Set a temporary cookie (expires in 1 sec), just enough for sth to be received by the server
                      // and used for login.
                      // TODO: look into other options ('secure', 'domain', etc.), see if any are applicable
                      Cookies.set('tempToken', idToken, { expires: 1 });
                      // * Redirect to this page (login) with said cookie
                      location.assign('/');
                    }
                  }
                }
              }}
            >
              <div>
                <input id="email" ref={email} />
              </div>
              <div>
                <input type="password" id="password" ref={password} />
              </div>
              <button type="submit">Log In</button>
            </form>
          </StyledLogin>
        );
      }}
    </Mutation>
  );
}

export default Login;
