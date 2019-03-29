import React, { useState } from "react";
import { Mutation } from "react-apollo";
import styled from "styled-components";
import { CREATE_TODO } from "../other/queries";
import { TodoList } from "./Main";

const StyledCreateNewTodo = styled.form``;

interface NewTodoInputProps {
  selectedList: TodoList;
}

export default function NewTodoInput({ selectedList }: NewTodoInputProps) {
  const [content, setContent] = useState("");
  const optimisticResponse = {
    __typename: "Mutation",
    createTodo: {
      __typename: "Todo",
      id: "temp",
      added_on: new Date(),
      completed: false,
      completed_on: null,
      content,
      deadline: null,
      description: "",
      important: false,
      order: selectedList.todos.length + 1
    }
  };

  return (
    <Mutation
      mutation={CREATE_TODO}
      optimisticResponse={optimisticResponse}
      update={(cache, { data }) => {
        if (data) {
          const { createTodo } = data;
          cache.writeData({
            data: {
              list: {
                ...selectedList,
                todos: selectedList.todos.concat(createTodo)
              }
            }
          });
        }
      }}
    >
      {(createTodo) => {
        return (
          <StyledCreateNewTodo
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              createTodo({
                variables: {
                  content,
                  listId: selectedList.id
                }
              });
              setContent("");
            }}
          >
            <input
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setContent(e.target.value);
              }}
              value={content}
            />
          </StyledCreateNewTodo>
        );
      }}
    </Mutation>
  );
}
