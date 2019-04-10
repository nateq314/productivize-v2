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

export default function Todos({
  selectedList,
  selectedTodoId,
  setSelectedTodoId,
  todos
}: TodosProps) {
  const [draggingID, setDraggingID] = useState<string | null>(null);
  const sortedTodos = useMemo(() => {
    return [...todos].sort((todoA, todoB) =>
      todoB.order > todoA.order ? -1 : 1
    );
  }, [todos]);

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
              lists: lists.map((list) => {
                if (list.id !== selectedList.id) return list;
                const prevOrder = (todos.find(
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
        <StyledTodosListSection>
          <CreateNewTodo selectedList={selectedList} />
          <DragDropContext
            // onDragStart={(start, provided) => {
            // }}
            // onDragUpdate={(update, provided) => {
            // }}
            onDragEnd={(result) => {
              const { destination, source, draggableId } = result;
              const todo = sortedTodos[source.index];
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
                  listId: selectedList.id,
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
            <Droppable droppableId={selectedList.id}>
              {(provided) => (
                <TodosList
                  draggingID={draggingID}
                  innerRef={provided.innerRef}
                  {...provided.droppableProps}
                  placeholder={provided.placeholder}
                  selectedList={selectedList}
                  selectedTodoId={selectedTodoId}
                  setDraggingID={setDraggingID}
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
