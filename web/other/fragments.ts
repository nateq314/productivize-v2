import gql from "graphql-tag";

const FETCH_LIST = gql`
  fragment containingList on List {
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
`;

export { FETCH_LIST };
