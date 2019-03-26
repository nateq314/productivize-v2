import React, { useContext } from "react";
import styled from "styled-components";
import { Query } from "react-apollo";
import Login from "../components/Login";
import AppBar from "../components/AppBar";
import Main from "../components/Main";
import { LISTS_QUERY } from "../other/queries";
import { UserContext } from "./_app";

const StyledHome = styled.div``;

function Home() {
  const user = useContext(UserContext);
  return (
    <StyledHome>
      {user ? (
        <>
          <AppBar />
          <Main />
        </>
      ) : (
        <Login />
      )}
    </StyledHome>
  );
}

export default Home;
