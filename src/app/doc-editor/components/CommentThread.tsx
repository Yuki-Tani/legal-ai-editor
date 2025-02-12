'use client';

import React, { useState } from "react";
import { CommentData } from "../types";

interface CommentThreadProps {
  selectionText: string;
  comments: CommentData[];
  onAddComment: (content: string) => void;
  onReplace: (replacement: string) => void;
}

const CommentThread: React.FC<CommentThreadProps> = ({
  selectionText,
  comments,
  onAddComment,
  onReplace,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (inputValue.trim()) {
      onAddComment(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <div
      style={{
        marginBottom: "16px",
        border: "1px solid #ccc",
        background: "#ffffff",
        padding: "8px",
      }}
    >
      <h4>選択テキスト: {selectionText}</h4>
      {comments.map((comment) => (
        <div key={comment.id} style={{ marginBottom: "8px" }}>
          <strong>{comment.author}:</strong> {comment.content}
          {comment.replacement && (
            <div style={{ marginTop: "4px", fontStyle: "italic" }}>
              <span>提案: {comment.replacement}</span>
              <button
                style={{ marginLeft: "8px" }}
                onClick={() => onReplace(comment.replacement!)}
              >
                置換
              </button>
            </div>
          )}
        </div>
      ))}
      <div style={{ marginTop: "8px" }}>
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          rows={2}
          style={{ width: "100%" }}
        />
        <button onClick={handleSend} style={{ marginTop: "4px" }}>
          コメント追加
        </button>
      </div>
    </div>
  );
};

export default CommentThread;
