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
  selectedList: string;
  setDraggingID: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedList: (listId: string) => void;
}

export default function Lists({
  draggingID,
  lists,
  selectedList,
  setDraggingID,
  setSelectedList,
  openUpdateListModal
}: ListsProps) {
  return (
    <Droppable droppableId="lists">
      {(provided) => (
        <StyledLists {...provided.droppableProps} ref={provided.innerRef}>
          {lists.map((list, index) => {
            const active = selectedList === list.id;
            return (
              <ListItem
                key={list.id}
                active={active}
                index={index}
                isDragging={draggingID === list.id}
                list={list}
                openUpdateListModal={openUpdateListModal}
                setDraggingID={setDraggingID}
                setSelectedList={setSelectedList}
              />
            );
          })}
          {provided.placeholder}
        </StyledLists>
      )}
    </Droppable>
  );
}
