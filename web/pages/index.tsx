import React, { useContext } from "react";
import styled from "styled-components";
import Login from "../components/Login";
import { UserContext } from "./_app";
import Main from "../components/Main";

const StyledHome = styled.div``;

function Home() {
  const user = useContext(UserContext);
  return <StyledHome>{user ? <Main /> : <Login />}</StyledHome>;
}

export default Home;
