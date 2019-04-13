import React, { useMemo } from "react";
import styled from "styled-components";
import { TodoList } from "../Main";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import Lists from "./Lists";

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
  const sortedLists = useMemo(() => {
    return [...lists].sort((listA, listB) =>
      listB.order > listA.order ? -1 : 1
    );
  }, [lists]);

  return (
    <StyledListsPane>
      <DragDropContext
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

          // TODO: implement this
          console.log("update list order");
        }}
      >
        <Droppable droppableId="lists">
          {(provided) => (
            <Lists
              innerRef={provided.innerRef}
              lists={sortedLists}
              openUpdateListModal={openUpdateListModal}
              placeholder={provided.placeholder}
              selectedList={selectedList}
              setSelectedList={setSelectedList}
            />
          )}
        </Droppable>
      </DragDropContext>
      <div className="add_new" onClick={openNewListModal}>
        Add New List
      </div>
    </StyledListsPane>
  );
}
