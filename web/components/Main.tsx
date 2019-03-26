import React from "react";
import styled from "styled-components";
import AppBar from "./AppBar";
import AppContent from "./AppContent";

const StyledMain = styled.div`
  height: 100vh;
  display: grid;
  grid-template-rows: 50px auto;
  grid-template-areas: "appbar" "app_content";
`;

export default function Main() {
  return (
    <StyledMain>
      <AppBar />
      <AppContent />
    </StyledMain>
  );
}
