import { gql } from "apollo-boost";

export const FETCH_CURRENT_USER = gql`
  query {
    current_user {
      id
      uid
      email
    }
  }
`;

export const FETCH_LISTS = gql`
  query {
    lists {
      id
      name
      order
      todos {
        id
        content
      }
    }
  }
`;

export const FETCH_TODOS = gql`
  query FetchTodos($listId: String!) {
    todos(listId: $listId) {
      id
      content
      important
      completed
    }
  }
`;

export const LOGOUT = gql`
  mutation {
    logout {
      error
    }
  }
`;

export const CREATE_LIST = gql`
  mutation CreateList($name: String!) {
    createList(name: $name) {
      id
      name
      order
      todos {
        id
        content
      }
    }
  }
`;
