import { ApolloClient, NormalizedCacheObject } from 'apollo-boost';
import App, { AppProps, Container } from 'next/app';
import * as React from 'react';
import { ApolloProvider, Query } from 'react-apollo';
import GlobalStyles from '../components/GlobalStyles';
import { FETCH_CURRENT_USER } from '../other/queries';
import withApolloClient from '../other/with-apollo-client';
import { TodoList } from '../components/Main';

export interface User {
  email: string;
  first_name: string;
  id: string;
  last_name: string;
  list_invitations: TodoList[];
  // actually a lot more than this but for now this is all we want to deal with
}

interface MyAppProps extends AppProps {
  apolloClient: ApolloClient<NormalizedCacheObject>;
}

/**
 * Yes the user object is stored in Apollo state but we don't want to have to
 * use <Query query={FETCH_CURRENT_USER}></Query> plus render props for
 * EVERY component that needs access to it. So we only do that once here, near
 * the top, then put the user object in React Context for ease of access.
 */
export const UserContext = React.createContext<User | null>(null);

class MyApp extends App<MyAppProps> {
  public render() {
    const { Component, pageProps, apolloClient } = this.props;
    return (
      <Container>
        <GlobalStyles />
        <ApolloProvider client={apolloClient}>
          <Query query={FETCH_CURRENT_USER}>
            {({ data }) => {
              const user = data ? data.current_user : null;
              return (
                <UserContext.Provider value={user}>
                  <Component {...pageProps} />
                </UserContext.Provider>
              );
            }}
          </Query>
        </ApolloProvider>
      </Container>
    );
  }
}

export default withApolloClient(MyApp);
