import React from "react";
import { Draggable } from "react-beautiful-dnd";
import styled from "styled-components";
import { TodoList } from "./Main";
import DeleteList from "./DeleteList";

const StyledListItem = styled.ul`
  padding: 20px 0px;
  background-color: #202020;
  margin: 10px 0px;

  &.active {
    background-color: #341;
  }
`;

interface ListItemProps {
  active: boolean;
  index: number;
  list: TodoList;
  openUpdateListModal: (list: TodoList) => void;
  setSelectedList: (listId: string) => void;
}

export default function ListItem({
  active,
  index,
  list,
  setSelectedList,
  openUpdateListModal
}: ListItemProps) {
  return (
    <Draggable draggableId={list.id} index={index}>
      {(provided, snapshot) => (
        <StyledListItem
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          className={active ? "active" : ""}
        >
          <span onClick={() => setSelectedList(list.id)}>{list.name}</span>
          <DeleteList listId={list.id}>
            {(deleteList) => <span onClick={deleteList}> Delete</span>}
          </DeleteList>
          <span onClick={() => openUpdateListModal(list)}> Update</span>
        </StyledListItem>
      )}
    </Draggable>
  );
}
