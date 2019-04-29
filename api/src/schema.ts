import { gql } from 'apollo-server-express';
import { auth, firestore } from 'firebase-admin';

export interface ListMemberInfoDB {
  order: number;
}

type Opaque<K, T> = T & { __TYPE__: K };
export type Email = Opaque<'Email', string>;
export type UID = Opaque<'UID', string>;

export interface ListDB {
  admin: string;
  name: string;
  members: UID[];
  member_info: {
    [key: string]: ListMemberInfoDB;
  };
  pending_members: Email[];
}

export interface ListGQL {
  admin?: UserGQL;
  id: string;
  members?: UserGQL[];
  name: string;
  order?: number;
  pending_members: string[];
  todos?: TodoGQL[];
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
  list_invitations: string[];
}

export type CombinedUserDB = UserDB & auth.UserRecord;

export interface UserGQL {
  disabled?: boolean;
  displayName?: string;
  email?: string;
  first_name?: string;
  id: string;
  last_name?: string;
  list_invitations?: ListGQL[];
  phoneNumber?: string;
  photoURL?: string;
}

const schema = gql`
  scalar DateTime
  scalar JSON

  # GraphQL schema includes 'order' as a property of lists. Storing the order on
  # a per-member basis in the DB is an implementation detail. As far as FE is
  # concerned, it might as well be stored as a property of the list itself.
  type List {
    admin: User!
    id: ID!
    name: String!
    order: Int!
    todos: [Todo!]!
    members: [User!]!
    pending_members: [String!]! # array of emails
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
    updateList(id: ID!, name: String, order: Int, newMembers: [String!]): List!
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
    register(email: String!, password: String!, first_name: String!, last_name: String!): Result!
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
    list_invitations: [List!]!
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
