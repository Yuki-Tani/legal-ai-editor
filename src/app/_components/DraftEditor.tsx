'use client'

import { CSSProperties, JSX, useEffect, useRef, useState } from "react"
import { BaseEditor } from "slate"
import { Editable, ReactEditor, RenderElementProps, RenderLeafProps } from "slate-react"
import { DraftElement, DraftText } from "../_types/Draft"
import styles from "./DraftEditor.module.css"
import { useDraftContext } from "./DraftContext"

type DraftEditorProps = {
  renderExtensions?: (props: DraftEditorExtensionProps) => JSX.Element
  style?: CSSProperties,
}

type DraftEditorExtensionProps = {
  isEditorFocused: boolean,
}

export default function DraftEditor({renderExtensions, style}: DraftEditorProps): JSX.Element {
  const [draft,] = useDraftContext();
  const ref = useRef<HTMLDivElement>(null);
  const isFocused = useDraftEditorFocus(ref);

  useEffect(() => {
    if (!isFocused) {
      window.getSelection()?.removeAllRanges();
    }
  }, [isFocused]);

  return (
    <div ref={ref}>
      <Editable
        className={styles.editor}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        onKeyDown={(event) => {
          // Ctrl + D : デバッグ用に現在のドラフトをコンソールに出力
          if (event.ctrlKey && event.key === "d") {
            event.preventDefault();
            console.log(draft);
          }
        }}
        style={style}
      />
      {renderExtensions && renderExtensions({ isEditorFocused: isFocused })}
    </div>
  )
}

function useDraftEditorFocus(ref: React.RefObject<HTMLElement | null>): boolean {
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleFocusIn = () => {
      setIsFocused(true);
    }
    const handleFocusOut = (e: FocusEvent) => {
      if (!e.relatedTarget || !element.contains(e.relatedTarget as HTMLElement)) {
        setIsFocused(false);
      }
    }

    element.addEventListener("focusin", handleFocusIn);
    element.addEventListener("focusout", handleFocusOut);

    return () => {
      element.removeEventListener("focusin", handleFocusIn);
      element.removeEventListener("focusout", handleFocusOut);
    };
  }, [ref]);

  return isFocused;
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
      return <DraftElementParagraph {...props} />;
    case "heading":
      return <DraftElementHeading {...props} />;
    default:
      return <></>;
  }
}

function renderLeaf(props: RenderLeafProps): JSX.Element {
  return (
    <>
      <span
        className={[
          ("selected" in props.leaf ? styles.selected : ""),
          ("suggested" in props.leaf ? styles.suggested : ""),
        ].join(" ")}
        {...props.attributes}
      >
          {props.children}
      </span>
      {("suggested" in props.leaf) &&
        <span
          className={[
            ("selected" in props.leaf ? styles.selected : ""),
            styles.suggestion,
          ].join(" ")}
        >
          {props.leaf.suggestion}
        </span>
      }
    </>
  );
}

function DraftElementParagraph(props: RenderElementProps): JSX.Element {
  if (props.element.type != "paragraph") return <></>;
  return <p className={styles.paragraph} {...props.attributes}>{props.children}</p>;
}

function DraftElementHeading(props: RenderElementProps): JSX.Element {
  if (props.element.type != "heading") return <></>;
  switch(props.element.level) {
    case 1:
      return <h1 className={styles.heading} {...props.attributes}>{props.children}</h1>;
    case 2:
      return <h2 className={styles.heading} {...props.attributes}>{props.children}</h2>;
    case 3:
      return <h3 className={styles.heading} {...props.attributes}>{props.children}</h3>;
    case 4:
      return <h4 className={styles.heading} {...props.attributes}>{props.children}</h4>;
    case 5:
      return <h5 className={styles.heading} {...props.attributes}>{props.children}</h5>;
    case 6:
      return <h6 className={styles.heading} {...props.attributes}>{props.children}</h6>;
    default:
      return <h6 className={styles.heading} {...props.attributes}>{props.children}</h6>;
  }
}
