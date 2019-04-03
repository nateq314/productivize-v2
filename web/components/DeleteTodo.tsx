import React from "react";
import { Mutation } from "react-apollo";
import styled from "styled-components";
import { DELETE_TODO } from "../other/mutations";
import { TodoList, Todo } from "./Main";

const StyledDeleteTodo = styled.a``;

interface DeleteTodoProps {
  selectedList: TodoList;
  todo: Todo;
}

export default function DeleteTodo({ selectedList, todo }: DeleteTodoProps) {
  const optimisticResponse = {
    __typename: "Mutation",
    deleteTodo: {
      __typename: "Result",
      success: true
    }
  };

  return (
    <Mutation
      mutation={DELETE_TODO}
      optimisticResponse={optimisticResponse}
      update={(cache, { data }) => {
        if (data) {
          const {
            deleteTodo: { success }
          } = data;
          if (success) {
            cache.writeData({
              data: {
                list: {
                  ...selectedList,
                  todos: selectedList.todos.filter((t) => t.id !== todo.id)
                }
              }
            });
          }
        }
      }}
    >
      {(deleteTodo) => (
        <StyledDeleteTodo
          className="deleteTodo"
          onClick={() => {
            deleteTodo({
              variables: {
                listId: selectedList.id,
                todoId: todo.id
              }
            });
          }}
        >
          {" "}
          Delete
        </StyledDeleteTodo>
      )}
    </Mutation>
  );
}
