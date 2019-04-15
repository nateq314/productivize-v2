import { gql } from "apollo-boost";

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

export const DELETE_LIST = gql`
  mutation DeleteList($id: ID!) {
    deleteList(id: $id) {
      success
      message
    }
  }
`;

export const UPDATE_LIST = gql`
  mutation UpdateList($id: ID!, $name: String, $order: Int) {
    updateList(id: $id, name: $name, order: $order) {
      id
      name
      order
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
      message
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
    $order: Int
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
