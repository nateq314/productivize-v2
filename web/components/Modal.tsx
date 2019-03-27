import React, { useEffect, useRef } from "react";
import styled from "styled-components";

const StyledModal = styled.div`
  position: fixed;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  visibility: hidden;
  z-index: 2;
  transition: 0.25s opacity;
  display: grid;
  grid-template-areas: "dialog";
  grid-template-columns: auto;
  grid-template-rows: auto;
  align-items: center;
  justify-items: center;

  &.visible {
    visibility: visible;
    opacity: 1;
  }

  & > * {
    grid-area: dialog;
    background-color: #fff;
    padding: 20px;
    color: #222;
  }
`;

interface ModalProps {
  children: React.ReactNode;
  setVisibility: React.Dispatch<React.SetStateAction<boolean>>;
  visible: boolean;
}

export default function Modal({
  children,
  setVisibility,
  visible
}: ModalProps) {
  const dialog = useRef<HTMLDivElement>(null);
  useModalListeners(visible, setVisibility, dialog);

  return (
    <StyledModal className={`Modal ${visible ? "visible" : ""}`}>
      <div className="Modal-dialog" ref={dialog}>
        {children}
      </div>
    </StyledModal>
  );
}

function useModalListeners(
  visible: boolean,
  setVisibility: React.Dispatch<React.SetStateAction<boolean>>,
  avoidCloseClickRegion: React.RefObject<HTMLDivElement>
) {
  const closeModalKeyboardEventListener = (e: KeyboardEvent) => {
    if (e.key == "Escape") {
      setVisibility(false);
    }
  };

  const closeModalMouseEventListener = (e: MouseEvent) => {
    const className = (e.target as Element).className;
    if (!className.includes("Modal ")) {
      e.stopPropagation();
      return;
    }
    setVisibility(false);
  };

  useEffect(() => {
    if (visible) {
      document.addEventListener(
        "keydown",
        closeModalKeyboardEventListener,
        false
      );
      document.addEventListener(
        "mousedown",
        closeModalMouseEventListener,
        false
      );
      (avoidCloseClickRegion.current as HTMLDivElement).addEventListener(
        "mousedown",
        closeModalMouseEventListener,
        false
      );
    }
    return () => {
      document.removeEventListener(
        "keydown",
        closeModalKeyboardEventListener,
        false
      );
      document.removeEventListener("mousedown", closeModalMouseEventListener);
      (avoidCloseClickRegion.current as HTMLDivElement).removeEventListener(
        "mousedown",
        closeModalMouseEventListener
      );
    };
  }, [visible]);
}
