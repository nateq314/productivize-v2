import { gql } from "apollo-boost";
import { TodoList, Todo } from "../components/Main";

export interface ListEventsSubscriptionData {
  subscriptionData: {
    data?: {
      listEvents: {
        listCreated?: TodoList;
        listDeleted?: { id: string };
        listUpdated?: TodoList;
        todoCreated?: Todo;
        todoDeleted?: { id: string; list_id: string };
        todoUpdated?: Todo;
        metadata?: any;
      };
    };
  };
}

export const LIST_EVENTS_SUBSCRIPTION = gql`
  subscription listEvents {
    listEvents {
      metadata
      listCreated {
        id
        name
        order
        todos {
          id
        }
      }
      listDeleted {
        id
      }
      listUpdated {
        id
        name
        order
      }
      todoCreated {
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
      todoDeleted {
        id
        list_id
      }
      todoUpdated {
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
