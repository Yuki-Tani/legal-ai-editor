'use client'

import { CSSProperties, JSX, ReactNode, useEffect, useState } from "react"
import { useDraftContext } from "./DraftContext";

type DraftEditorFocusedRangePopupProps = {
  isEditorFocused: boolean,
  children: ReactNode,
  style?: CSSProperties,
}

export function DraftEditorFocusedRangePopup({isEditorFocused, children, style}: DraftEditorFocusedRangePopupProps): JSX.Element {
  const [, draftAccessor] = useDraftContext();
  const [position, setPosition] = useState<{ top: number, left: number } | null>(null);

  const shouldHide = !isEditorFocused || !draftAccessor.isRangeExpanded();

  useEffect(() => {
    if (shouldHide) {
      setPosition(null);
      return;
    }
    const timer = setTimeout(() => {
      if (shouldHide) return;
      const cursor = draftAccessor.getFocusCursorForLayout();
      if (!cursor) return;
      setPosition({
        top: cursor.bottom,
        left: cursor.left
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [draftAccessor, shouldHide]);

  return (
    !shouldHide && position
      ? <div style={{ position: "absolute", top: position.top, left: position.left, ...style }}>
          {children}
        </div>
      : <></>
  );
}