import React from "react";
import { Draggable } from "react-beautiful-dnd";
import styled from "styled-components";
import { TodoList } from "../Main";
import DeleteList from "../DeleteList";

const StyledListItem = styled.li`
  padding: 20px 0px;
  background-color: #202020;
  margin: 0px 0px 10px 0px;
  transition: 0.25s background-color;
  position: relative;

  &.active {
    background-color: #341;

    &.isDragging {
      background-color: #560;
    }
  }

  &.isDragging {
    background-color: #404040;
  }

  .dragHandle {
    position: absolute;
    right: 15px;
    top: 15px;
    width: 30px;
    height: 30px;
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

interface ListItemProps {
  active: boolean;
  index: number;
  isDragging: boolean;
  list: TodoList;
  openUpdateListModal: (list: TodoList) => void;
  setDraggingID: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedList: (listId: string) => void;
}

export default function ListItem({
  active,
  index,
  isDragging,
  list,
  setDraggingID,
  setSelectedList,
  openUpdateListModal
}: ListItemProps) {
  return (
    <Draggable draggableId={list.id} index={index}>
      {(provided, snapshot) => (
        <StyledListItem
          {...provided.draggableProps}
          ref={provided.innerRef}
          className={
            (active ? "active " : "") +
            (isDragging || snapshot.isDragging ? "isDragging " : "")
          }
          onClick={() => setSelectedList(list.id)}
          style={
            snapshot.isDropAnimating
              ? {
                  ...provided.draggableProps.style,
                  transitionDuration: "0.01s"
                }
              : provided.draggableProps.style
          }
        >
          <span>{list.name}</span>
          <DeleteList listId={list.id}>
            {(deleteList) => (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  deleteList();
                }}
              >
                {" "}
                Delete
              </span>
            )}
          </DeleteList>
          <span
            onClick={(e) => {
              e.stopPropagation();
              openUpdateListModal(list);
            }}
          >
            {" "}
            Update
          </span>
          <span> {list.order}</span>
          <span
            {...provided.dragHandleProps}
            className="dragHandle"
            onMouseDown={(e) => {
              setDraggingID(list.id);
              if (provided.dragHandleProps) {
                provided.dragHandleProps.onMouseDown(e);
              }
            }}
            onMouseUp={() => setDraggingID(null)}
          />
        </StyledListItem>
      )}
    </Draggable>
  );
}
