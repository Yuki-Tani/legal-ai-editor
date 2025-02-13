'use client';

import React, { useRef, useState, useEffect } from "react";

interface EditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onTextSelect: (selectedText: string, startOffset: number, endOffset: number) => void;
}

interface TempHighlight {
  span: HTMLSpanElement;
  x: number;
  y: number;
  selectedText: string;
}

const Editor: React.FC<EditorProps> = ({
  content,
  onContentChange,
  onTextSelect,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const [tempHighlight, setTempHighlight] = useState<TempHighlight | null>(null);
  const [originalText, setOriginalText] = useState<string>("");
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editorRef.current) return;
    const editorRect = editorRef.current.getBoundingClientRect();
    setMouseDownPos({
      x: e.clientX - editorRect.left,
      y: e.clientY - editorRect.top,
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    if (editorRef.current) {
      setOriginalText(editorRef.current.innerText);
    }

    const extracted = range.extractContents();
    const highlightSpan = document.createElement("span");
    highlightSpan.style.backgroundColor = "yellow";
    highlightSpan.appendChild(extracted);
    range.insertNode(highlightSpan);

    const editorRect = editorRef.current?.getBoundingClientRect();
    if (!editorRect) return;

    let x = e.clientX - editorRect.left;
    let y = e.clientY - editorRect.top;
    if (mouseDownPos) {
      x = Math.max(mouseDownPos.x, x) + 10;
      y = Math.max(mouseDownPos.y, y);
    }

    if (y < 0) y = 0;
    const editorWidth = editorRect.width;
    const limitX = editorWidth - 200;
    if (x > limitX) {
      x = limitX;
      y = -60;
    }

    const selectedText = highlightSpan.innerText;
    setTempHighlight({ span: highlightSpan, x, y, selectedText });

    selection.removeAllRanges();

    if (editorRef.current) {
      onContentChange(editorRef.current.innerText);
    }
  };

  const handleConfirm = () => {
    if (!tempHighlight || !editorRef.current) return;

    const { selectedText } = tempHighlight;
    const fullText = editorRef.current.innerText;
    const startOffset = fullText.indexOf(selectedText);
    const endOffset = startOffset + selectedText.length;

    onTextSelect(selectedText, startOffset, endOffset);
    onContentChange(editorRef.current.innerText);
    setTempHighlight(null);
  };

  const handleCancel = () => {
    if (!tempHighlight || !editorRef.current) return;

    editorRef.current.innerText = originalText;
    onContentChange(originalText);
    setTempHighlight(null);
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onContentChange((e.target as HTMLDivElement).innerText);
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        handleCancel();
      }
    };

    if (tempHighlight) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [tempHighlight]);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onInput={handleInput}
        style={{
          width: "100%",
          padding: "16px",
          boxSizing: "border-box",
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          minHeight: "400px",
          overflowY: "auto",
        }}
      >
        {content}
      </div>

      {/* ポップアップ */}
      {tempHighlight && (
        <div
          ref={popupRef}
          style={{
            position: "absolute",
            left: tempHighlight.x,
            top: tempHighlight.y,
            height: "60px",
            width: "200px",
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            padding: "8px",
            zIndex: 100,
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          <div>コメントを作成しますか？</div>
          <div style={{ marginTop: "8px", textAlign: "right" }}>
            <button onClick={handleConfirm} style={{ marginRight: "4px" }}>
              はい
            </button>
            <button onClick={handleCancel}>いいえ</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
