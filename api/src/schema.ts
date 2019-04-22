import { gql } from "apollo-server-express";
import { auth, firestore } from "firebase-admin";

export interface ListMemberInfoDB {
  is_admin: boolean;
  pending_acceptance: boolean;
}

export interface ListMemberInfoGQL extends ListMemberInfoDB {
  user: UserGQL;
}

export interface ListDB {
  name: string;
  order: number;
  members: string[];
  member_info: {
    [key: string]: ListMemberInfoDB;
  };
}

export interface ListGQL {
  id: string;
  members: ListMemberInfoGQL[];
  name: string;
  order: number;
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

export interface UserDB {
  first_name: string;
  last_name: string;
}

export interface UserGQL extends auth.UserRecord {
  first_name: string;
  last_name: string;
  id: string;
}

const schema = gql`
  scalar DateTime
  scalar JSON

  type List {
    id: ID!
    name: String!
    order: Int!
    todos: [Todo!]!
    members: [ListMember!]!
  }

  type ListMember {
    is_admin: Boolean!
    pending_acceptance: Boolean!
    user: User!
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
    register(
      email: String!
      password: String!
      first_name: String!
      last_name: String!
    ): Result!
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
    disabled: Boolean!
    displayName: String
    email: String!
    first_name: String!
    last_name: String!
    phoneNumber: String
    photoURL: String
  }

  # This is not used currently. We only pull from firestore 'users' collection,
  # in order to present consistent user data to the frontend.
  type FBAuthUserRecord {
    id: ID!
    uid: String!
    disabled: Boolean!
    displayName: String
    email: String!
    phoneNumber: String
    photoURL: String
  }
`;

export default schema;
