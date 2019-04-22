import { gql } from "apollo-boost";

export const LOGOUT = gql`
  mutation {
    logout {
      error
    }
  }
`;

export const REGISTER = gql`
  mutation Register(
    $email: String!
    $password: String!
    $first_name: String!
    $last_name: String!
  ) {
    register(
      email: $email
      password: $password
      first_name: $first_name
      last_name: $last_name
    ) {
      success
      message
    }
  }
`;

export const CREATE_LIST = gql`
  mutation CreateList($name: String!) {
    createList(name: $name) {
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
      }
    }
  }
`;

export const DELETE_LIST = gql`
  mutation DeleteList($id: ID!) {
    deleteList(id: $id) {
      success
      message
    }
  }
`;

export const UPDATE_LIST = gql`
  mutation UpdateList(
    $id: ID!
    $name: String
    $order: Int
    $newMembers: [String!]
  ) {
    updateList(id: $id, name: $name, order: $order, newMembers: $newMembers) {
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

export const CREATE_TODO = gql`
  mutation CreateTodo(
    $content: String!
    $important: Boolean
    $deadline: DateTime
    $remind_on: DateTime
    $listId: String!
  ) {
    createTodo(
      content: $content
      deadline: $deadline
      important: $important
      listId: $listId
      remind_on: $remind_on
    ) {
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
`;

export const DELETE_TODO = gql`
  mutation DeleteTodo($listId: String!, $todoId: String!) {
    deleteTodo(listId: $listId, todoId: $todoId) {
      success
    }
  }
`;

export const UPDATE_TODO = gql`
  mutation UpdateTodo(
    $listId: String!
    $destListId: String
    $todoId: String!
    $completed: Boolean
    $content: String
    $deadline: DateTime
    $description: String
    $important: Boolean
    $order: Int
    $remind_on: DateTime
  ) {
    updateTodo(
      listId: $listId
      destListId: $destListId
      todoId: $todoId
      completed: $completed
      content: $content
      deadline: $deadline
      description: $description
      important: $important
      order: $order
      remind_on: $remind_on
    ) {
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
`;
