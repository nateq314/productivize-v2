import React from "react";
import { TodoList } from "./Main";
import UpdateList from "./UpdateList";
import ListModal from "./ListModal";

interface UpdateListModalContainerProps {
  list: TodoList;
  closeModal: () => void;
}

export default function UpdateListModalContainer({
  list,
  closeModal
}: UpdateListModalContainerProps) {
  return (
    <UpdateList list={list}>
      {(updateList) => (
        <ListModal
          createOrUpdateList={updateList}
          list={list}
          closeModal={closeModal}
        />
      )}
    </UpdateList>
  );
}
