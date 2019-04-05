import * as express from "express";
import { createServer } from "https";
import { ApolloServer } from "apollo-server-express";
import * as path from "path";
import * as fs from "fs";

import typeDefs from "./schema";
import resolvers from "./resolvers";

const PORT = process.env.PORT || 3000;

const app = express();

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  subscriptions: {
    onConnect: (connectionParams: any, webSocket) => {
      if (connectionParams.wsAuth) {
        // The resolution of the below promise will be the value of
        // `context.connection.context` in the withFilter() predicate function.
        // We use this to determine whether or not a given publication belongs
        // to (ought to be received by) a user.

        // TODO: implement full-blown authentication for WS connection. Receive
        // an idToken and verify it with the Firebase admin API.
        return Promise.resolve({
          currentUserUID: connectionParams.wsAuth.currentUserUID
        });
      }
      throw new Error("Missing uid!");
    }
  }
});

apolloServer.applyMiddleware({ app });

const httpsServer = createServer(
  {
    // key: fs.readFileSync(`../certs/localhost.key`),
    key: fs.readFileSync(path.join(process.cwd(), "certs", "localhost.key")),
    // cert: fs.readFileSync(`../certs/localhost.crt`)
    cert: fs.readFileSync(path.join(process.cwd(), "certs", "localhost.crt"))
  },
  app
);
apolloServer.installSubscriptionHandlers(httpsServer);

httpsServer.listen({ port: PORT }, () => {
  console.log(
    `🚀 Subscriptions ready at ws://localhost:${PORT}${
      apolloServer.subscriptionsPath
    }`
  );
});
