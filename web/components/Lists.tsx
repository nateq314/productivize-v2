import React from "react";
import styled from "styled-components";
import { TodoList } from "./Main";
import ListItem from "./ListItem";

const StyledLists = styled.ul`
  grid-area: list;
  list-style-type: none;
  margin: 0;
  padding: 0;
`;

interface ListsProps {
  innerRef: (element: HTMLElement | null) => any;
  lists: TodoList[];
  openUpdateListModal: (list: TodoList) => void;
  placeholder?: React.ReactElement<HTMLElement> | null;
  selectedList: string;
  setSelectedList: (listId: string) => void;
}

export default function Lists({
  innerRef,
  lists,
  placeholder,
  selectedList,
  setSelectedList,
  openUpdateListModal
}: ListsProps) {
  return (
    <StyledLists ref={innerRef}>
      {lists.map((list, index) => {
        const active = selectedList === list.id;
        return (
          <ListItem
            key={list.id}
            active={active}
            index={index}
            list={list}
            openUpdateListModal={openUpdateListModal}
            setSelectedList={setSelectedList}
          />
        );
      })}
      {placeholder}
    </StyledLists>
  );
}
