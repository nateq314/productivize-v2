import React, { useState } from "react";
import { Mutation } from "react-apollo";
import { DragDropContext } from "react-beautiful-dnd";
import styled from "styled-components";
import { Todo, TodoList } from "../Main";
import CreateNewTodo from "../CreateNewTodo";
import Todos from "./Todos";
import { UPDATE_TODO } from "../../other/mutations";
import { FETCH_LISTS } from "../../other/queries";

const StyledTodosPane = styled.section`
  grid-area: todos;
`;

interface TodosPaneProps {
  selectedLists: TodoList[];
  selectedTodoId: string | null;
  setSelectedTodoId: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function TodosPane({
  selectedLists,
  selectedTodoId,
  setSelectedTodoId
}: TodosPaneProps) {
  const [draggingID, setDraggingID] = useState<string | null>(null);

  return (
    <Mutation
      mutation={UPDATE_TODO}
      update={(cache, { data }) => {
        if (data) {
          const { updateTodo } = data;
          const { lists } = cache.readQuery({
            query: FETCH_LISTS
          }) as { lists: TodoList[] };
          cache.writeQuery({
            query: FETCH_LISTS,
            data: {
              // TODO: find a more efficient way to calculate this stuff
              lists: lists.map((list) => {
                if (list.id !== updateTodo.list_id) return list;
                const prevList = selectedLists.find(
                  (l) => l.id === updateTodo.list_id
                ) as TodoList;
                const prevOrder = (prevList.todos.find(
                  (todo) => todo.id === updateTodo.id
                ) as Todo).order;
                const newOrder = updateTodo.order;
                if (newOrder > prevOrder) {
                  // If the order INCREASED
                  return {
                    ...list,
                    todos: list.todos.map((t) => {
                      if (t.id === updateTodo.id) {
                        return updateTodo;
                      } else if (t.order <= newOrder && t.order > prevOrder) {
                        // decrement all todos with order such that
                        // prevOrder < order <= newOrder
                        return {
                          ...t,
                          order: t.order - 1
                        };
                      } else return t;
                    })
                  };
                } else {
                  // If the order DECREASED
                  return {
                    ...list,
                    todos: list.todos.map((t) => {
                      if (t.id === updateTodo.id) {
                        return updateTodo;
                      } else if (t.order >= newOrder && t.order < prevOrder) {
                        // increment all todos with order such that
                        // newOrder <= order < prevOrder
                        return {
                          ...t,
                          order: t.order + 1
                        };
                      } else return t;
                    })
                  };
                }
              })
            }
          });
        }
      }}
    >
      {(updateTodo) => (
        <StyledTodosPane>
          <CreateNewTodo selectedLists={selectedLists} />
          <DragDropContext
            // onDragStart={(start, provided) => {
            // }}
            // onDragUpdate={(update, provided) => {
            // }}
            onDragEnd={(result) => {
              const { destination, source, draggableId } = result;
              const todo = selectedLists
                .map((l) => l.todos)
                .reduce((allTodos, currTodos) => allTodos.concat(currTodos))
                .find((t) => t.id === draggableId) as Todo;
              setDraggingID(null);
              if (!destination) return;
              if (
                destination.droppableId === source.droppableId &&
                destination.index === source.index
              ) {
                // The user dragged the list item and then dropped it back in its
                // original place. So no need to do anything.
                return;
              }

              updateTodo({
                variables: {
                  listId: todo.list_id,
                  todoId: draggableId,
                  order: destination.index + 1
                },
                optimisticResponse: {
                  __typename: "Mutation",
                  updateTodo: {
                    ...todo,
                    order: destination.index + 1
                  }
                }
              });
            }}
          >
            {selectedLists.map((list) => (
              <Todos
                key={list.id}
                draggingID={draggingID}
                selectedList={list}
                selectedTodoId={selectedTodoId}
                setDraggingID={setDraggingID}
                setSelectedTodoId={setSelectedTodoId}
              />
            ))}
          </DragDropContext>
        </StyledTodosPane>
      )}
    </Mutation>
  );
}
