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

interface UnpublishablePayload {
  members: string[];
}

function resolve(payload: any) {
  return payload;
}

export default Object.entries({
  listEvents: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(LIST_EVENTS),
      (
        payload: UnpublishablePayload,
        variables: any,
        context: any,
        info: any
      ) => {
        const { members } = payload;
        return members.includes(context.connection.context.currentUserUID);
      }
    )
  }
}).reduce((resolvers: any, [key, value]) => {
  resolvers[key] = {
    ...value,
    resolve
  };
  return resolvers;
}, {});
