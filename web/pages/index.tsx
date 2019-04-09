import React, { useContext } from "react";
import styled from "styled-components";
import Login from "../components/Login";
import Main from "../components/Main";
import { UserContext } from "./_app";

const StyledHome = styled.div``;

function Home() {
  const user = useContext(UserContext);
  return <StyledHome>{user ? <Main /> : <Login />}</StyledHome>;
}

export default Home;
