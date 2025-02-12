'use client';

import React from "react";
import { SelectionRange } from "../types";
import CommentThread from "./CommentThread";

interface CommentSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  selections: SelectionRange[];
  onAddComment: (selectionId: string, content: string) => void;
  onReplaceSelection: (selectionId: string, replacement: string) => void;
}

const CommentSidebar: React.FC<CommentSidebarProps> = ({
  isOpen,
  toggleSidebar,
  selections,
  onAddComment,
  onReplaceSelection,
}) => {
  return (
    <div
      style={{
        width: isOpen ? "320px" : "40px",
        position: "fixed",
        right: 0,
        top: 0,
        height: "100vh",
        backgroundColor: "#f8f8f8",
        borderLeft: "1px solid #ddd",
        padding: "8px",
        boxSizing: "border-box",
        transition: "width 0.3s",
      }}
    >
      {/* トグルボタンを右上に配置 */}
      <button
        onClick={toggleSidebar}
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          whiteSpace: "nowrap",
        }}
      >
        {isOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
      </button>

      {/* サイドバーが開いている場合のみ内容を表示 */}
      {isOpen && (
        <div style={{ marginTop: "40px" }}>
          <h3>コメントスレッド</h3>
          {selections.length === 0 && <p>コメントはありません</p>}
          {selections.map((selection) => (
            <CommentThread
              key={selection.id}
              selectionText={selection.text}
              comments={selection.comments}
              onAddComment={(content) => onAddComment(selection.id, content)}
              onReplace={(replacement) =>
                onReplaceSelection(selection.id, replacement)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSidebar;
