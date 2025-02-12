'use client';

import React, { useRef } from "react";

interface EditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onTextSelect: (selectedText: string, startOffset: number, endOffset: number) => void;
}

const Editor: React.FC<EditorProps> = ({
  content,
  onContentChange,
  onTextSelect,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!range.collapsed) {
        const selectedText = range.toString();
        const startOffset = content.indexOf(selectedText);
        const endOffset = startOffset + selectedText.length;
        onTextSelect(selectedText, startOffset, endOffset);
        selection.removeAllRanges();
      }
    }
  };

  return (
    <div
      className="editor-container"
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onInput={(e) =>
        onContentChange((e.target as HTMLDivElement).innerText)
      }
      onMouseUp={handleMouseUp}
      style={{
        width: "100%",
        padding: "16px",
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        minHeight: "400px",
        overflowY: "auto",
        position: "relative",
      }}
    >
      {content}
    </div>
  );
};

export default Editor;
