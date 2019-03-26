import { Query } from "react-apollo";
import React, { useState } from "react";
import styled from "styled-components";
import TodoLists from "./TodoLists";
import Todos from "./Todos";
import TodoDetails from "./TodoDetails";
import { LISTS_QUERY } from "../other/queries";

const StyledAppContent = styled.div`
  grid-area: app_content;
  display: grid;
  grid-template-columns: 25% 50% 25%;
  grid-template-areas: "lists todos details";
`;

interface TodoListsQueryResult {
  lists: Array<
    TodoList & {
      todos: Todo[];
    }
  >;
}

export interface TodoList {
  id: string;
  name: string;
  order: number;
}

export interface Todo {
  id: string;
  content: string;
}

export default function AppContent() {
  const [selectedList, setSelectedList] = useState(0);
  return (
    <Query query={LISTS_QUERY}>
      {({ loading, error, data }) => {
        if (loading) return "Loading...";
        if (error) return `Error! ${error.message}`;
        // returned data actually contains the todos nested into each list.
        // But we want to pass only the lists themselves to <TodoLists />,
        // and only the todos for the currently selected list to <Todo />.
        // So separate them out here.
        const lists: TodoList[] = (data as TodoListsQueryResult).lists.map(
          ({ id, name, order }) => ({
            id,
            name,
            order
          })
        );
        const todos: Todo[] = (data as TodoListsQueryResult).lists[selectedList]
          .todos;
        return (
          <StyledAppContent>
            <TodoLists lists={lists} />
            <Todos todos={todos} />
            <TodoDetails />
          </StyledAppContent>
        );
      }}
    </Query>
  );
}
