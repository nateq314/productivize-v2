import React, { useState } from "react";
import { Mutation } from "react-apollo";
import { DragDropContext, DraggableLocation } from "react-beautiful-dnd";
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

export interface DragState {
  draggableID: string | null;
  source?: DraggableLocation;
  dest?: DraggableLocation | null;
}

export default function TodosPane({
  selectedLists,
  selectedTodoId,
  setSelectedTodoId
}: TodosPaneProps) {
  const [dragState, setDragState] = useState<DragState>({
    draggableID: null
  });

  return (
    <Mutation
      mutation={UPDATE_TODO}
      update={(cache, { data }) => {
        if (data) {
          const { updateTodo } = data;
          const { lists } = cache.readQuery({
            query: FETCH_LISTS
          }) as { lists: TodoList[] };
          const prevTodo = selectedLists
            .map((l) => l.todos)
            .reduce((allTodos, currTodos) => allTodos.concat(currTodos))
            .find((t) => t.id === updateTodo.id) as Todo;
          const prevOrder = prevTodo.order;
          const newOrder = updateTodo.order;
          const changedLists = updateTodo.list_id !== prevTodo.list_id;
          cache.writeQuery({
            query: FETCH_LISTS,
            data: {
              // TODO: find a more efficient way to calculate this stuff
              lists: lists.map((list) => {
                // if this is a list other than the destination list
                if (list.id !== updateTodo.list_id) {
                  // if it didn't change lists
                  if (!changedLists) return list;
                  else {
                    // if it DID change lists and this is a list other than the
                    // source or destination list:
                    if (list.id !== prevTodo.list_id) return list;
                    return {
                      ...list,
                      todos: list.todos
                        .filter((t) => t.id !== updateTodo.id)
                        .map((t) => {
                          if (t.order < prevOrder) return t;
                          return {
                            ...t,
                            order: t.order - 1
                          };
                        })
                    };
                  }
                }
                if (!changedLists) {
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
                } else {
                  // todo changed lists
                  return {
                    ...list,
                    todos: list.todos
                      .map((t) => {
                        if (t.order < newOrder) return t;
                        return {
                          ...t,
                          order: t.order + 1
                        };
                      })
                      .concat(updateTodo)
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
            onDragStart={(start, provided) => {
              setDragState({
                draggableID: start.draggableId,
                source: start.source,
                dest: {
                  droppableId: start.source.droppableId,
                  index: start.source.index
                }
              });
            }}
            onDragUpdate={(update, provided) => {
              setDragState({
                ...dragState,
                dest: update.destination
              });
            }}
            onDragEnd={(result) => {
              const { destination, source, draggableId } = result;
              const todo = selectedLists
                .map((l) => l.todos)
                .reduce((allTodos, currTodos) => allTodos.concat(currTodos))
                .find((t) => t.id === draggableId) as Todo;
              setDragState({
                draggableID: null
              });
              if (!destination) return;
              const changedLists =
                destination.droppableId !== source.droppableId;
              if (!changedLists && destination.index === source.index) {
                // The user dragged the list item and then dropped it back in its
                // original place. So no need to do anything.
                return;
              }

              const variables: any = {
                listId: todo.list_id,
                todoId: draggableId,
                order: destination.index + 1
              };
              if (changedLists) variables.destListId = destination.droppableId;
              updateTodo({
                variables,
                optimisticResponse: {
                  __typename: "Mutation",
                  updateTodo: {
                    ...todo,
                    list_id: destination.droppableId,
                    order: destination.index + 1
                  }
                }
              });
            }}
          >
            {selectedLists.map((list) => (
              <Todos
                key={list.id}
                dragState={dragState}
                selectedList={list}
                selectedTodoId={selectedTodoId}
                setDragState={setDragState}
                setSelectedTodoId={setSelectedTodoId}
              />
            ))}
          </DragDropContext>
        </StyledTodosPane>
      )}
    </Mutation>
  );
}
