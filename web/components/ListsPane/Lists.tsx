import React from "react";
import styled from "styled-components";
import { TodoList } from "../Main";
import ListItem from "./ListItem";
import { Droppable } from "react-beautiful-dnd";

const StyledLists = styled.ul`
  grid-area: list;
  list-style-type: none;
  margin: 0;
  padding: 0;
  padding-top: 10px;
`;

interface ListsProps {
  draggingID: string | null;
  lists: TodoList[];
  openUpdateListModal: (list: TodoList) => void;
  selectedListIds: string[];
  setDraggingID: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedListIds: (listIds: string[]) => void;
}

export default function Lists({
  draggingID,
  lists,
  selectedListIds,
  setDraggingID,
  setSelectedListIds,
  openUpdateListModal
}: ListsProps) {
  return (
    <Droppable droppableId="lists">
      {(provided) => (
        <StyledLists {...provided.droppableProps} ref={provided.innerRef}>
          {lists.map((list, index) => {
            const active = selectedListIds.indexOf(list.id) >= 0;
            return (
              <ListItem
                key={list.id}
                active={active}
                index={index}
                isDragging={draggingID === list.id}
                list={list}
                openUpdateListModal={openUpdateListModal}
                setDraggingID={setDraggingID}
                setSelectedListIds={setSelectedListIds}
                toggleListSelectedStatus={(listId: string) => {
                  if (!selectedListIds.includes(listId)) {
                    setSelectedListIds(selectedListIds.concat(listId));
                  } else if (selectedListIds.length > 1) {
                    // There must always be at least one selected list.
                    setSelectedListIds(
                      selectedListIds.filter((id) => id !== listId)
                    );
                  }
                }}
              />
            );
          })}
          {provided.placeholder}
        </StyledLists>
      )}
    </Droppable>
  );
}
