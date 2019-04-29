import { gql } from 'apollo-boost';

export const FETCH_CURRENT_USER = gql`
  query {
    current_user {
      id
      email
      first_name
      last_name
      list_invitations
    }
  }
`;

export const FETCH_LISTS = gql`
  query {
    lists {
      admin {
        id
      }
      id
      name
      order
      members {
        id
        email
        first_name
        last_name
      }
      pending_members
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
