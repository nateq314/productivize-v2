import gql from 'graphql-tag';

const FETCH_LIST = gql`
  fragment containingList on List {
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
