import React from "react";
import styled from "styled-components";

const StyledMain = styled.div``;

export default function Main() {
  return <StyledMain>Main Content Will Go Here</StyledMain>;
  // <Query query={LISTS_QUERY}>
  //   {({ loading, error, data }) => {
  //     if (loading) return "Loading...";
  //     if (error) return `Error! ${error.message}`;
  //     return JSON.stringify(data.lists);
  //   }}
  // </Query>
}
