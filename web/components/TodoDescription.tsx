import React, { useState, useEffect } from "react";
import { Mutation, MutationFn, OperationVariables } from "react-apollo";
import styled from "styled-components";
import { Todo } from "./Main";
import { useEscapeKeyListener, useRenderLogger } from "../effects";
import { UPDATE_TODO } from "../other/mutations";
import { Subscription, Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";

const StyledTodoDescription = styled.textarea`
  resize: none;
  background: none;
  border: 1px solid transparent;
  border-radius: 8px;
  transition: 0.3s background-color;
  color: #ccc;
  width: 90%;
  height: 200px;
  padding: 10px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.4);
  }

  &.editing {
    border: 1px solid #555;
    background-color: rgba(0, 0, 0, 0.4);
  }
`;

interface TodoDescriptionProps {
  selectedListId: string;
  todo: Todo;
}

interface SubscriptionData {
  updateTodo: MutationFn<any, OperationVariables>;
  description: string;
}

let inputObserver$ = new Subject<SubscriptionData>();

export default function TodoDescription({
  selectedListId,
  todo
}: TodoDescriptionProps) {
  const [isEditing, setEditingStatus] = useState(false);
  const [pendingDesc, setPendingDesc] = useState(todo.description);

  useEscapeKeyListener(() => setEditingStatus(false), isEditing);

  // Run this every time the user selects a different todo.
  useEffect(() => {
    let subscription: Subscription;
    setEditingStatus(false);
    setPendingDesc(todo.description);
    subscription = inputObserver$
      .pipe(debounceTime(500))
      .subscribe(({ updateTodo, description }) => {
        // TODO: Implement proper error handling here, since the value of the
        // textarea is only set according to the real Todo data at time of
        // initial mount. Thereafter, it only shows whatever the user types,
        // and we're *assuming* that the updateTodo() calls work. But if they
        // don't, that needs to be reflected here. In that case, `pendingDesc`
        // should be reset to `todo.description`.
        updateTodo({
          variables: {
            listId: selectedListId,
            todoId: todo.id,
            description
          }
        });
      });
    return () => {
      subscription.unsubscribe();
    };
  }, [todo.id]);

  return (
    <Mutation mutation={UPDATE_TODO}>
      {(updateTodo) => {
        return (
          <StyledTodoDescription
            className={isEditing ? "editing" : ""}
            readOnly={isEditing ? false : true}
            value={pendingDesc}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              setPendingDesc(e.target.value);
              inputObserver$.next({ updateTodo, description: e.target.value });
            }}
            onClick={isEditing ? undefined : () => setEditingStatus(true)}
          />
        );
      }}
    </Mutation>
  );
}
