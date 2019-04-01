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
    $todoId: String!
    $completed: Boolean
    $content: String
    $deadline: DateTime
    $description: String
    $important: Boolean
    $remind_on: DateTime
  ) {
    updateTodo(
      listId: $listId
      todoId: $todoId
      completed: $completed
      content: $content
      deadline: $deadline
      description: $description
      important: $important
      remind_on: $remind_on
    ) {
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
