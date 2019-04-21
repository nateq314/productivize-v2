import React, { useState } from "react";
import firebase from "../other/firebase";

import styled from "styled-components";
import { Button } from "@material-ui/core";
import { Mutation } from "react-apollo";
import { REGISTER } from "../other/mutations";

const StyledRegister = styled.div`
  padding-top: 30px;

  h1 {
    letter-spacing: 1px;
  }
`;

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);

  return (
    <StyledRegister className="example">
      {registrationSubmitted ? (
        <div className="registrationSubmitted">
          <p>Registration Submitted.</p>
          <Button>Go Home</Button>
        </div>
      ) : (
        <Mutation mutation={REGISTER}>
          {(register) => (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                console.log("submitting form");
                await register({
                  variables: {
                    email,
                    password,
                    first_name: firstName,
                    last_name: lastName
                  }
                });
                setRegistrationSubmitted(true);
              }}
            >
              <div>
                <input
                  id="first_name"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.currentTarget.value)}
                />
              </div>
              <div>
                <input
                  id="last_name"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.currentTarget.value)}
                />
              </div>
              <div>
                <input
                  id="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                />
              </div>
              <div>
                <input
                  type="password"
                  id="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                />
              </div>
              <button type="submit">Register</button>
            </form>
          )}
        </Mutation>
      )}
    </StyledRegister>
  );
}
