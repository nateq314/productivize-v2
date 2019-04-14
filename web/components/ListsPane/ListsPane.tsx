import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { TodoList } from "../Main";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import Lists from "./Lists";
import { Mutation } from "react-apollo";
import { UPDATE_LIST } from "../../other/mutations";
import { FETCH_LISTS } from "../../other/queries";

const StyledListsPane = styled.section`
  grid-area: lists;
  border-right: 1px solid #333;
  display: grid;
  grid-template-areas: "list" "add_new";
  grid-template-rows: auto 50px;
  .add_new {
    border-top: 1px solid #333;
    grid-area: add_new;
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

interface ListsPaneProps {
  lists: TodoList[];
  selectedList: string;
  openNewListModal: () => void;
  openUpdateListModal: (list: TodoList) => void;
  setSelectedList: (listId: string) => void;
}

export default function ListsPane({
  lists,
  selectedList,
  setSelectedList,
  openNewListModal,
  openUpdateListModal
}: ListsPaneProps) {
  const [draggingID, setDraggingID] = useState<string | null>(null);
  const sortedLists = useMemo(() => {
    return [...lists].sort((listA, listB) =>
      listB.order > listA.order ? -1 : 1
    );
  }, [lists]);

  return (
    <Mutation
      mutation={UPDATE_LIST}
      update={(cache, { data }) => {
        if (data) {
          const { updateList } = data;
          const prevOrder = (lists.find(
            (list) => list.id === updateList.id
          ) as TodoList).order;
          const newOrder = updateList.order;
          cache.writeQuery({
            query: FETCH_LISTS,
            data: {
              lists:
                newOrder > prevOrder
                  ? // If the order INCREASED
                    lists.map((l) => {
                      if (l.id === updateList.id) return updateList;
                      else if (l.order <= newOrder && l.order > prevOrder) {
                        return {
                          ...l,
                          order: l.order - 1
                        };
                      } else return l;
                    })
                  : // If the order DECREASED
                    lists.map((l) => {
                      if (l.id === updateList.id) return updateList;
                      else if (l.order >= newOrder && l.order < prevOrder) {
                        return {
                          ...l,
                          order: l.order + 1
                        };
                      } else return l;
                    })
            }
          });
        }
      }}
    >
      {(updateList) => (
        <StyledListsPane>
          <DragDropContext
            // onDragStart={(start, provided) => {
            // }}
            // onDragUpdate={(update, provided) => {
            // }}
            onDragEnd={(result) => {
              const { destination, source, draggableId } = result;
              const list = sortedLists[source.index];
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

              updateList({
                variables: {
                  id: draggableId,
                  order: destination.index + 1
                },
                optimisticResponse: {
                  __typename: "Mutation",
                  updateList: {
                    ...list,
                    order: destination.index + 1
                  }
                }
              });
            }}
          >
            <Lists
              draggingID={draggingID}
              lists={sortedLists}
              openUpdateListModal={openUpdateListModal}
              selectedList={selectedList}
              setDraggingID={setDraggingID}
              setSelectedList={setSelectedList}
            />
          </DragDropContext>
          <div className="add_new" onClick={openNewListModal}>
            Add New List
          </div>
        </StyledListsPane>
      )}
    </Mutation>
  );
}
