import { useEffect } from "react";

export function useEscapeKeyListener(
  active: boolean,
  setActiveStatus: React.Dispatch<React.SetStateAction<boolean>>
) {
  const closeModalKeyboardEventListener = (e: KeyboardEvent) => {
    if (e.key == "Escape") {
      setActiveStatus(false);
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
  setVisibility: React.Dispatch<React.SetStateAction<boolean>>,
  avoidCloseClickRegion: React.RefObject<HTMLDivElement>
) {
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
  }, [props]);
}
