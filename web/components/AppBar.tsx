import React, { useContext } from "react";
import Link from "next/link";
import styled from "styled-components";
import Logout from "./Logout";
import { UserContext } from "../pages/_app";

const StyledAppBar = styled.header`
  background-color: rgba(255, 255, 255, 0.1);
  grid-area: appbar;
`;

export default function AppBar() {
  const user = useContext(UserContext);
  return (
    <StyledAppBar className="AppBar">
      <span>Welcome{user ? `, ${user.email}` : ""}</span>
      <Link href="/about">
        <a>About Us</a>
      </Link>
      <Logout />
    </StyledAppBar>
  );
}
