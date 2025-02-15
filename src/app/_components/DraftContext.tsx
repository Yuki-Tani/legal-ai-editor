'use client'

import React, { JSX, useRef } from "react";
import { Slate, useSlate, useSlateStatic, withReact } from "slate-react";
import { createEditor } from "slate";
import { Draft, DraftAccessor, emptyDraft } from "../_types/Draft";

export function DraftContext({children}: {children: React.ReactNode}): JSX.Element {
  const editor = useRef(withReact(createEditor()));
  return (
    <Slate editor={editor.current} initialValue={emptyDraft}>
      {children}
    </Slate>
  )
}

export function useDraftContext(): [Draft, DraftAccessor] {
  const editor = useSlate();
  const accessor = new DraftAccessor(editor);
  return [editor.children, accessor];
}

export function useDraftAccessorContext(): DraftAccessor {
  const editor = useSlateStatic();
  const accessor = useRef(new DraftAccessor(editor));
  return accessor.current;
}

