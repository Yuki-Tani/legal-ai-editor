'use client'

import { CSSProperties, JSX, useEffect, useRef, useState } from "react"
import { BaseEditor } from "slate"
import { Editable, ReactEditor, RenderElementProps, RenderLeafProps } from "slate-react"
import { DraftElement, DraftText } from "../_types/Draft"
import styles from "./DraftEditor.module.css"
import { useDraftContext } from "./DraftContext"
import { DraftEditorFocusedRangePopup } from "./DraftEditorPopup";
import { draftSample1 } from "./DraftSample"

type DraftEditorProps = {
  renderExtensions?: (props: DraftEditorExtensionProps) => JSX.Element
  style?: CSSProperties,
}

type DraftEditorExtensionProps = {
  isEditorFocused: boolean,
  draftAccessor: ReturnType<typeof useDraftContext>[1],
}

export default function DraftEditor({renderExtensions, style}: DraftEditorProps): JSX.Element {
  const [draft, draftAccessor] = useDraftContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const isEditorFocused = useEditorFocus(containerRef);

  useEffect(() => {
    if (!isEditorFocused) {
      window.getSelection()?.removeAllRanges();
    }
  }, [isEditorFocused]);

  return (
    <div ref={containerRef}>
      <Editable
        className={styles.editor}
        renderElement={renderElement}
        renderLeaf={renderLeaf} 
        onKeyDown={(event) => {
          // Ctrl + D : デバッグ
          if (event.ctrlKey && event.key === "d") {
            event.preventDefault();
            console.log(draft);
          }
          // Ctrl + 1 : サンプルドラフトを挿入
          if (event.ctrlKey && event.key === "1") {
            event.preventDefault();
            draftAccessor.replaceDraft(draftSample1);
          }
        }}
        style={style}
      />
      {renderExtensions && renderExtensions({
        isEditorFocused,
        draftAccessor
      })}
    </div>
  );
}

function useEditorFocus(ref: React.RefObject<HTMLElement | null>): boolean {
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onFocusIn = () => setFocused(true);
    const onFocusOut = (e: FocusEvent) => {
      if (!e.relatedTarget || !el.contains(e.relatedTarget as HTMLElement)) {
        setFocused(false);
      }
    };
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    return () => {
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
    };
  }, [ref]);

  return focused;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor
    Element: DraftElement
    Text: DraftText
  }
}

function renderElement(props: RenderElementProps): JSX.Element {
  switch (props.element.type) {
    case "paragraph":
      return (
        <p {...props.attributes} className={styles.paragraph}>
          {props.children}
        </p>
      );
    case "heading":
      return (
        <h2 {...props.attributes} className={styles.heading}>
          {props.children}
        </h2>
      );
    default:
      return <span {...props.attributes}>{props.children}</span>;
  }
}

function renderLeaf(props: RenderLeafProps): JSX.Element {
  const { attributes, children, leaf } = props;

  let className = "";
  if ("selected" in leaf) {
    className += styles.selected + " ";
  }
  if ("suggested" in leaf) {
    className += styles.suggested + " ";
  }

  return (
    <>
      <span {...attributes} className={className}>
        {children}
      </span>
      { "suggestion" in leaf &&
        <span className={styles.suggestion}>
          {leaf.suggestion}
        </span>
      }
    </>
  );
}
