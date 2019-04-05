import React, { useEffect, useState } from "react";
import { Mutation } from "react-apollo";
import styled from "styled-components";
import { CREATE_TODO } from "../other/mutations";
import { TodoList } from "./Main";
import Input from "./Input";

const StyledCreateNewTodo = styled.form`
  input.readonly {
    background-color: rgba(255, 0, 0, 0.2);
  }
`;

interface NewTodoInputProps {
  selectedList: TodoList;
}

export default function NewTodoInput({ selectedList }: NewTodoInputProps) {
  const [content, setContent] = useState("");
  const [readonly, setReadonly] = useState(false);
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

  useEffect(() => {
    if (!selectedList.todos.find((todo) => todo.id === "temp")) {
      setReadonly(false);
    }
  }, [selectedList.todos]);

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
              createTodo(args);
              setContent("");
              setReadonly(true);
            }}
          >
            <Input
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setContent(e.target.value);
              }}
              readOnly={readonly}
              value={content}
            />
          </StyledCreateNewTodo>
        );
      }}
    </Mutation>
  );
}
