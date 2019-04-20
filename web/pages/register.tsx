import React, { useState } from "react";
import firebase from "../other/firebase";

import styled from "styled-components";
import { Button } from "@material-ui/core";

const StyledRegister = styled.div`
  padding-top: 30px;

  h1 {
    letter-spacing: 1px;
  }
`;

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);

  return (
    <StyledRegister className="example">
      {registrationSubmitted ? (
        <div className="registrationSubmitted">
          <p>Registration Submitted.</p>
          <Button>Go Home</Button>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            console.log("submitting form");
            const userCredential = await firebase
              .auth()
              .createUserWithEmailAndPassword(email, password);
            if (userCredential.user) {
              await userCredential.user.sendEmailVerification({
                url: "http://localhost:4000/"
              });
              console.log("email verification has been sent");
              // TODO: redirect to home?
              setRegistrationSubmitted(true);
            }
          }}
        >
          <div>
            <input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
          </div>
          <div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
          </div>
          <button type="submit">Register</button>
        </form>
      )}
    </StyledRegister>
  );
}
