import React from "react";
import CreateList from "./CreateList";
import ListModal from "./ListModal";

interface CreateListModalContainerProps {
  closeModal: () => void;
}

export default function CreateListModalContainer({
  closeModal
}: CreateListModalContainerProps) {
  return (
    <CreateList>
      {(createList) => (
        <ListModal createOrUpdateList={createList} closeModal={closeModal} />
      )}
    </CreateList>
  );
}
