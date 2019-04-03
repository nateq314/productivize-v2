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

export const FETCH_LIST = gql`
  query FetchList($listId: String!) {
    list(listId: $listId) {
      id
      name
      order
      todos {
        id
        added_on
        content
        completed
        completed_on
        deadline
        description
        important
        order
        remind_on
      }
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
        added_on
        content
        completed
        completed_on
        deadline
        description
        important
        order
        remind_on
      }
    }
  }
`;
