import { gql } from "apollo-server-express";

export interface List {
  id: string;
  name: string;
  order: number;
  uid: string;
  todos: Todo[];
}

export interface Todo {
  id: string;
  list_id?: string;
  completed: boolean;
  content: string;
  deadline?: number;
  added_on?: number;
  completed_on?: number;
  description: string;
  important: boolean;
  order: number;
}

const schema = gql`
  scalar DateTime

  type List {
    id: ID!
    name: String!
    order: Int!
    todos: [Todo]
  }

  type ListMutation {
    created: List
    deleted: List
    updated: List
  }

  type LoginResult {
    error: String
    user: User
  }

  type Mutation {
    createList(name: String!): List!
    createTodo(
      content: String!
      important: Boolean
      deadline: DateTime
      remind_on: DateTime
      listId: String!
      remind_on: DateTime
    ): Todo!
    deleteTodo(listId: String!, todoId: String!): Result!
    updateTodo(
      listId: String!
      todoId: String!
      completed: Boolean
      content: String
      deadline: DateTime
      description: String
      important: Boolean
      remind_on: DateTime
    ): Todo!
    login(idToken: String, session: String): LoginResult!
    logout: LoginResult!
  }

  type Query {
    current_user: User
    lists: [List!]!
  }

  type Result {
    success: Boolean!
    message: String
  }

  type Subscription {
    listEvents: ListMutation!
    todoEvents: TodoMutation!
  }

  type Todo {
    added_on: DateTime!
    id: ID!
    list_id: String!
    completed: Boolean!
    completed_on: DateTime
    content: String!
    deadline: DateTime
    description: String!
    important: Boolean!
    order: Int!
    remind_on: DateTime
  }

  type TodoMutation {
    created: Todo
    deleted: Todo
    updated: Todo
  }

  type User {
    id: ID!
    uid: String!
    email: String!
    emailVerified: Boolean!
    displayName: String
    phoneNumber: String
    photoURL: String
    disabled: Boolean!
    passwordHash: String
    passwordSalt: String
    tokensValidAfterTime: String
  }
`;

export default schema;
