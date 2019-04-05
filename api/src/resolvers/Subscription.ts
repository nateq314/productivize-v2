import { GooglePubSub } from "@axelspringer/graphql-google-pubsub";
import { withFilter } from "apollo-server-express";

const credentials = require("../../credentials.json");

// All received messages pass through here first.
// This is annoying but if we don't do this, the messages don't come through
const commonMessageHandler = (message: any) => {
  try {
    const utf8 = Buffer.from(message.data, "base64").toString("utf-8");
    return JSON.parse(utf8);
  } catch {
    return {};
  }
};

export const pubsub = new GooglePubSub(
  {
    projectId: "focus-champion-231019",
    credentials
  },
  undefined,
  commonMessageHandler
);

export const LIST_EVENTS = "list_events";
export const TODO_EVENTS = "todo_events";

function resolve(payload: any) {
  return payload;
}

export default Object.entries({
  listEvents: {
    // subscribe: () => pubsub.asyncIterator(LIST_EVENTS)
    subscribe: withFilter(
      () => pubsub.asyncIterator(LIST_EVENTS),
      (payload: any, variables: any, context: any, info: any) => {
        // TODO: find a cleaner way to do this
        let mutation_uid = "";
        const { created, deleted, updated } = payload;
        if (created) mutation_uid = created.uid;
        else if (deleted) mutation_uid = deleted.uid;
        else if (updated) mutation_uid = updated.uid;
        return mutation_uid === context.connection.context.currentUserUID;
      }
    )
  },
  todoEvents: {
    subscribe: () => pubsub.asyncIterator(TODO_EVENTS)
  }
}).reduce((resolvers: any, [key, value]) => {
  resolvers[key] = {
    ...value,
    resolve
  };
  return resolvers;
}, {});
