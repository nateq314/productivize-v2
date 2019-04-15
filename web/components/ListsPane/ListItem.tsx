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
  setSelectedListIds: (listIds: string[]) => void;
  toggleListSelectedStatus: (listId: string) => void;
}

export default function ListItem({
  active,
  index,
  isDragging,
  list,
  setDraggingID,
  setSelectedListIds,
  toggleListSelectedStatus,
  openUpdateListModal
}: ListItemProps) {
  let mouseXY = { x: 0, y: 0 };
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
          onClick={(e: React.MouseEvent<HTMLLIElement>) => {
            const dx = e.screenX - mouseXY.x;
            const dy = e.screenY - mouseXY.y;
            if (dx <= 2 && dy <= 2) {
              if (e.shiftKey) toggleListSelectedStatus(list.id);
              else setSelectedListIds([list.id]);
            }
            mouseXY = { x: 0, y: 0 };
          }}
          onMouseDown={(e: React.MouseEvent<HTMLLIElement>) => {
            mouseXY = { x: e.screenX, y: e.screenY };
          }}
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
