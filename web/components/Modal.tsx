import React, { useRef } from "react";
import styled from "styled-components";
import { useEscapeKeyListener, useClickAwayListener } from "../effects";

const StyledModal = styled.div`
  position: fixed;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 1;
  visibility: visible;
  z-index: 2;
  /* transition: 0.25s opacity; */
  display: grid;
  grid-template-areas: "dialog";
  grid-template-columns: auto;
  grid-template-rows: auto;
  align-items: center;
  justify-items: center;

  & > * {
    grid-area: dialog;
    background-color: #fff;
    padding: 20px;
    color: #222;
  }
`;

interface ModalProps {
  children: React.ReactNode;
  closeModal: () => void;
}

export default function Modal({ children, closeModal }: ModalProps) {
  const dialog = useRef<HTMLDivElement>(null);
  useEscapeKeyListener(closeModal);
  useClickAwayListener(closeModal, dialog);

  return (
    <StyledModal className="Modal">
      <div className="Modal-dialog" ref={dialog}>
        {children}
      </div>
    </StyledModal>
  );
}
