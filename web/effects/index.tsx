import { useEffect } from "react";

export function useEscapeKeyListener(active: boolean, closeModal: () => void) {
  const closeModalKeyboardEventListener = (e: KeyboardEvent) => {
    if (e.key == "Escape") {
      closeModal();
    }
  };

  useEffect(() => {
    if (active) {
      document.addEventListener(
        "keydown",
        closeModalKeyboardEventListener,
        false
      );
    }
    return () => {
      document.removeEventListener(
        "keydown",
        closeModalKeyboardEventListener,
        false
      );
    };
  }, [active]);
}

export function useClickAwayListener(
  visible: boolean,
  closeModal: () => void,
  avoidCloseClickRegion: React.RefObject<HTMLDivElement>
) {
  const closeModalMouseEventListener = (e: MouseEvent) => {
    const className = (e.target as Element).className;
    if (!className.includes("Modal ")) {
      e.stopPropagation();
      return;
    }
    closeModal();
  };

  useEffect(() => {
    if (visible) {
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
      document.removeEventListener("mousedown", closeModalMouseEventListener);
      (avoidCloseClickRegion.current as HTMLDivElement).removeEventListener(
        "mousedown",
        closeModalMouseEventListener
      );
    };
  }, [visible]);
}

export function useRenderLogger(compName: string, props?: any) {
  useEffect(() => {
    console.log(`<${compName} /> render()`);
    if (props) console.log("props:", props);
  });
}
