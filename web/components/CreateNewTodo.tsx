import React, { useState } from "react";
import { Mutation } from "react-apollo";
import styled from "styled-components";
import { CREATE_TODO } from "../other/mutations";
import { TodoList } from "./Main";
import Input from "./Input";

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
      list_id: selectedList.id,
      added_on: new Date().toISOString(),
      completed: false,
      completed_on: null,
      content,
      deadline: null,
      description: "",
      important: false,
      order: selectedList.todos.length + 1,
      remind_on: null
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
              const args = {
                variables: {
                  content,
                  deadline: null,
                  important: false,
                  listId: selectedList.id,
                  remind_on: null
                }
              };
              console.log("About to call createTodo() with args:", args);
              createTodo(args);
              setContent("");
            }}
          >
            <Input
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
