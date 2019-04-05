import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  NormalizedCacheObject,
  split
} from "apollo-boost";
import { WebSocketLink } from "apollo-link-ws";
import fetch from "isomorphic-unfetch";
import { getMainDefinition } from "apollo-utilities";

let apolloClient: ApolloClient<NormalizedCacheObject>;
const isBrowser = typeof window !== "undefined";

// Polyfill fetch() on the server (used by apollo-client)
if (!isBrowser) {
  (global as any).fetch = fetch;
}

export const LINK_URI =
  "https://us-central1-focus-champion-231019.cloudfunctions.net/api/graphql";

function create(
  initialState: any,
  linkOptions: HttpLink.Options,
  wsAuth: { [key: string]: any }
) {
  const httpLink = new HttpLink({
    uri: LINK_URI,
    credentials: "include",
    ...linkOptions
  });

  const link = isBrowser
    ? split(
        // split based on operation type
        ({ query }) => {
          const { kind, operation } = getMainDefinition(query);
          return kind === "OperationDefinition" && operation === "subscription";
        },
        new WebSocketLink({
          uri: "wss://localhost:3000/graphql",
          options: {
            reconnect: true,
            connectionParams: { wsAuth }
          }
        }),
        httpLink
      )
    : httpLink;

  return new ApolloClient({
    connectToDevTools: isBrowser,
    ssrMode: !isBrowser,
    link,
    cache: new InMemoryCache().restore(initialState || {})
  });
}

export default function initApollo(
  initialState?: any,
  linkOptions: HttpLink.Options = {},
  wsAuth: { [key: string]: any } = {}
) {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (!isBrowser) {
    return create(initialState, linkOptions, wsAuth);
  }

  // Reuse client on the client-side
  if (!apolloClient) {
    apolloClient = create(initialState, linkOptions, wsAuth);
  }
  return apolloClient;
}
