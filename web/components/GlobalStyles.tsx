import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
  @import url("https://fonts.googleapis.com/css?family=Open+Sans");

  body {
    background-color: #101010;
    color: #eee;
    text-align: center;
    font-family: "Open Sans", sans-serif;
    margin: 0;
  }

  h1 {
    margin-top: 0px;
    color: #eee;
  }

  h2 {
    color: #b0b0b0;
  }
`;

export default GlobalStyles;
