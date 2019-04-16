import { gql } from "apollo-server-express";
import { firestore } from "firebase-admin";

export interface ListDB {
  name: string;
  order: number;
  owners: string[];
}

export interface ListGQL extends ListDB {
  id: string;
  todos: TodoGQL[];
}

export interface TodoDB {
  added_on: firestore.Timestamp | Date;
  completed: boolean;
  completed_on?: firestore.Timestamp | Date;
  content: string;
  deadline?: firestore.Timestamp | Date;
  description: string;
  important: boolean;
  order: number;
  remind_on?: firestore.Timestamp | Date;
}

export interface TodoGQL {
  id: string;
  added_on: string;
  list_id?: string;
  completed: boolean;
  completed_on?: string;
  content: string;
  deadline?: string;
  description: string;
  important: boolean;
  order: number;
  remind_on?: string;
}

const schema = gql`
  scalar DateTime
  scalar JSON

  type List {
    id: ID!
    name: String!
    order: Int!
    todos: [Todo!]!
    owners: [String!]!
  }

  type ListMutationEvent {
    listCreated: List
    listDeleted: List
    listUpdated: List
    todoCreated: Todo
    todoDeleted: Todo
    todoUpdated: Todo
    metadata: JSON
  }

  type LoginResult {
    error: String
    user: User
  }

  type Mutation {
    createList(name: String!): List!
    deleteList(id: ID!): Result!
    updateList(id: ID!, name: String, order: Int): List!
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
      destListId: String
      todoId: String!
      completed: Boolean
      content: String
      deadline: DateTime
      description: String
      important: Boolean
      order: Int
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
    listEvents: ListMutationEvent!
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
