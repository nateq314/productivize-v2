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

  type LoginResult {
    error: String
    user: User
  }

  type Mutation {
    createList(name: String!): List!
    createTodo(content: String!, listId: String!): Todo!
    deleteTodo(listId: String!, todoId: String!): Result!
    updateTodo(
      listId: String!
      todoId: String!
      completed: Boolean
      content: String
      deadline: DateTime
      description: String
      important: Boolean
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
    somethingChanged: Result
  }

  type Todo {
    added_on: DateTime!
    id: ID!
    completed: Boolean!
    completed_on: DateTime
    content: String!
    deadline: DateTime
    description: String!
    important: Boolean!
    order: Int!
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
