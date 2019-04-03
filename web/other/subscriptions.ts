import { gql } from "apollo-boost";
import { TodoList, Todo } from "../components/Main";

export interface ListEventsSubscriptionData {
  subscriptionData: {
    data?: {
      listEvents: {
        created?: TodoList;
        deleted?: { id: string };
        updated?: TodoList;
      };
    };
  };
}

export interface TodoEventsSubscriptionData {
  subscriptionData: {
    data?: {
      todoEvents: {
        created?: Todo;
        deleted?: Pick<Todo, "id" | "list_id">;
        updated?: Todo;
      };
    };
  };
}

export const LIST_EVENTS_SUBSCRIPTION = gql`
  subscription listEvents {
    listEvents {
      created {
        id
        name
        order
        todos {
          id
        }
      }
      deleted {
        id
      }
      updated {
        id
        name
        order
        todos {
          id
        }
      }
    }
  }
`;

export const TODO_EVENTS_SUBSCRIPTION = gql`
  subscription todoEvents {
    todoEvents {
      created {
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
      deleted {
        id
        list_id
      }
      updated {
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
