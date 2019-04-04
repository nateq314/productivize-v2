import React, { useMemo } from "react";
import styled from "styled-components";
import { TodoList } from "./Main";
import DeleteList from "./DeleteList";

const StyledTodoLists = styled.section`
  grid-area: lists;
  border-right: 1px solid #333;
  display: grid;
  grid-template-areas: "list" "add_new";
  grid-template-rows: auto 50px;

  ul {
    grid-area: list;
  }

  li.active {
    background-color: #341;
  }

  .add_new {
    border-top: 1px solid #333;
    grid-area: add_new;
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

interface TodoListsProps {
  lists: TodoList[];
  selectedList: string;
  openNewListModal: () => void;
  openUpdateListModal: (list: TodoList) => void;
  setSelectedList: (listId: string) => void;
}

export default function TodoLists({
  lists,
  selectedList,
  setSelectedList,
  openNewListModal,
  openUpdateListModal
}: TodoListsProps) {
  const sortedLists = useMemo(() => {
    return [...lists].sort((listA, listB) =>
      listB.order > listA.order ? -1 : 1
    );
  }, [lists]);

  return (
    <StyledTodoLists>
      <ul>
        {sortedLists.map((list) => {
          const active = selectedList === list.id;
          return (
            <li key={list.id} className={active ? "active" : ""}>
              <span onClick={() => setSelectedList(list.id)}>{list.name}</span>
              <DeleteList lists={lists} listId={list.id}>
                {(deleteList) => <span onClick={deleteList}> Delete</span>}
              </DeleteList>
              <span onClick={() => openUpdateListModal(list)}> Update</span>
            </li>
          );
        })}
      </ul>
      <div className="add_new" onClick={openNewListModal}>
        Add New List
      </div>
    </StyledTodoLists>
  );
}
