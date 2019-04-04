import { useEffect } from "react";

export function useEscapeKeyListener(closeModal: () => void, active?: boolean) {
  const closeModalKeyboardEventListener = (e: KeyboardEvent) => {
    if (e.key == "Escape") {
      closeModal();
    }
  };

  const hasActiveFlag = typeof active !== "undefined";

  useEffect(
    () => {
      if ((hasActiveFlag && active === true) || !hasActiveFlag) {
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
    },
    hasActiveFlag ? [active] : []
  );
}

export function useClickAwayListener(
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
    document.addEventListener("mousedown", closeModalMouseEventListener, false);
    (avoidCloseClickRegion.current as HTMLDivElement).addEventListener(
      "mousedown",
      closeModalMouseEventListener,
      false
    );
    return () => {
      document.removeEventListener("mousedown", closeModalMouseEventListener);
      (avoidCloseClickRegion.current as HTMLDivElement).removeEventListener(
        "mousedown",
        closeModalMouseEventListener
      );
    };
  }, []);
}

export function useRenderLogger(compName: string, props?: any) {
  useEffect(() => {
    console.log(`<${compName} /> render()`);
    if (props) console.log("props:", props);
  });
}
