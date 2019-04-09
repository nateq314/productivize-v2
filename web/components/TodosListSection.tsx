import React, { useMemo, useState } from "react";
import { Mutation } from "react-apollo";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import styled from "styled-components";
import { Todo, TodoList } from "./Main";
import CreateNewTodo from "./CreateNewTodo";
import TodosList from "./TodosList";
import { UPDATE_TODO } from "../other/mutations";
import { FETCH_LISTS } from "../other/queries";

const StyledTodosListSection = styled.section`
  grid-area: todos;
`;

interface TodosProps {
  selectedList: TodoList;
  selectedTodoId: string | null;
  setSelectedTodoId: React.Dispatch<React.SetStateAction<string | null>>;
  todos: Todo[];
}

interface TodoDragState {
  todo: Todo;
  newOrder: number;
}

export default function Todos({
  selectedList,
  selectedTodoId,
  setSelectedTodoId,
  todos
}: TodosProps) {
  const [dragState, setDragState] = useState<TodoDragState | null>(null);
  const optimisticResponse = dragState
    ? {
        __typename: "Mutation",
        updateTodo: {
          ...dragState.todo,
          order: dragState.newOrder
        }
      }
    : undefined;

  const sortedTodos = useMemo(() => {
    return [...todos].sort((todoA, todoB) =>
      todoB.order > todoA.order ? -1 : 1
    );
  }, [todos]);

  return (
    <Mutation
      mutation={UPDATE_TODO}
      optimisticResponse={optimisticResponse}
      update={(cache, { data }) => {
        const { lists } = cache.readQuery({
          query: FETCH_LISTS
        }) as { lists: TodoList[] };
        cache.writeQuery({
          query: FETCH_LISTS,
          data: {
            lists: lists.map((list) => {
              if (list.id !== selectedList.id) return list;
              const { newOrder, todo } = dragState as TodoDragState;
              if (newOrder > (dragState as TodoDragState).todo.order) {
                return {
                  ...list,
                  todos: list.todos.map((t) => {
                    if (t.id === todo.id) {
                      return {
                        ...todo,
                        order: newOrder
                      };
                    } else if (t.order <= newOrder && t.order >= todo.order) {
                      return {
                        ...t,
                        order: t.order - 1
                      };
                    } else return t;
                  })
                };
              } else {
                return {
                  ...list,
                  todos: list.todos.map((t) => {
                    if (t.id === todo.id) {
                      return {
                        ...todo,
                        order: newOrder
                      };
                    } else if (t.order >= newOrder && t.order <= todo.order) {
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
      }}
    >
      {(updateTodo) => (
        <StyledTodosListSection>
          <CreateNewTodo selectedList={selectedList} />
          <DragDropContext
            onDragStart={(start, provided) => {
              const todo = sortedTodos[start.source.index];
              setDragState({
                todo,
                newOrder: todo.order
              });
            }}
            onDragUpdate={(update, provided) => {
              if (update.destination) {
                setDragState({
                  todo: (dragState as TodoDragState).todo,
                  newOrder: update.destination.index + 1
                });
              }
            }}
            onDragEnd={(result) => {
              const { destination, source, draggableId } = result;
              if (!destination) return;

              if (
                destination.droppableId === source.droppableId &&
                destination.index === source.index
              ) {
                // The user dragged the list item and then dropped it back in its
                // original place. So no need to do anything.
                return;
              }

              if (dragState) {
                updateTodo({
                  variables: {
                    listId: selectedList.id,
                    todoId: draggableId,
                    order: dragState.newOrder
                  }
                });
              }
              setDragState(null);
            }}
          >
            <Droppable droppableId={selectedList.id}>
              {(provided) => (
                <TodosList
                  innerRef={provided.innerRef}
                  {...provided.droppableProps}
                  placeholder={provided.placeholder}
                  selectedList={selectedList}
                  selectedTodoId={selectedTodoId}
                  setSelectedTodoId={setSelectedTodoId}
                  todos={sortedTodos}
                />
              )}
            </Droppable>
          </DragDropContext>
        </StyledTodosListSection>
      )}
    </Mutation>
  );
}
