import { gql } from "apollo-boost";

export const FETCH_CURRENT_USER = gql`
  query {
    current_user {
      id
      email
      first_name
      last_name
    }
  }
`;

export const FETCH_LISTS = gql`
  query {
    lists {
      id
      name
      order
      members {
        is_admin
        pending_acceptance
        user {
          id
          email
          first_name
          last_name
        }
      }
      todos {
        id
        list_id
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
