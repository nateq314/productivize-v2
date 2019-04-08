import List from "./List";
import Mutation from "./Mutation";
import Query from "./Query";
import { firestore } from "firebase-admin";
const { GraphQLDateTime } = require("graphql-iso-date");

// subscriptions go on separate subscription-only api server
export default {
  // monkey patch serialize() because Cloud Firestore returns timestamps as a
  // proprietary Timestamp object that the original GraphQLDateTime serializer
  // doesn't recognize.
  DateTime: {
    ...GraphQLDateTime,
    serialize: (value: Date | firestore.Timestamp) =>
      value instanceof Date ? value : GraphQLDateTime.serialize(value.toDate())
  },
  List,
  Mutation,
  Query
};
