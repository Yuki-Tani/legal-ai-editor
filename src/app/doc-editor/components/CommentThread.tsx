'use client';

import React, { useState } from "react";
import { CommentData } from "../types";

interface CommentThreadProps {
  selectionText: string;
  comments: CommentData[];
  replacement: string;
  isAccepted: boolean;
  onAddComment: (content: string) => void;
  onReplace: () => void;
  onDecline: () => void;
  onDeleteComment: (commentId: string) => void;
  onDeleteThread: () => void;
  onUpdateThreadReplacement: (newReplacement: string) => void;
}

const CommentThread: React.FC<CommentThreadProps> = ({
  selectionText,
  comments,
  replacement,
  isAccepted,
  onAddComment,
  onReplace,
  onDecline,
  onDeleteComment,
  onDeleteThread,
  onUpdateThreadReplacement,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (inputValue.trim()) {
      onAddComment(inputValue.trim());
      setInputValue("");
    }
  };

  const threadStyle: React.CSSProperties = {
    marginBottom: "16px",
    border: "1px solid #ccc",
    background: "#ffffff",
    padding: "8px",
    opacity: isAccepted ? 0.5 : 1,
    pointerEvents: isAccepted ? "none" : "auto",
  };

  return (
    <div style={threadStyle}>
      <h4 style={{ marginBottom: "8px" }}>{selectionText}</h4>

      {/* コメント一覧 */}
      {comments.map((comment) => (
        <div
          key={comment.id}
          style={{
            marginBottom: "8px",
            paddingBottom: "8px",
            borderBottom: "1px solid #ddd",
          }}
        >
          <strong>{comment.author}:</strong> {comment.content}
          <div style={{ marginTop: "4px", textAlign: "left" }}>
            <button
              style={{ backgroundColor: "#fdd", border: "1px solid #d88" }}
              onClick={() => onDeleteComment(comment.id)}
            >
              コメントを削除
            </button>
          </div>
        </div>
      ))}

      {/* 新規コメント追加 */}
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

      {/* Replacement*/}
      <div style={{ marginTop: "12px", borderTop: "1px solid #ddd", paddingTop: "8px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>
          提案:
        </label>
        <textarea
          rows={2}
          style={{ width: "100%" }}
          value={replacement}
          onChange={(e) => onUpdateThreadReplacement(e.target.value)}
        />
        <div style={{ marginTop: "4px", textAlign: "right" }}>
          <button style={{ marginRight: "8px" }} onClick={onReplace}>
            Accept
          </button>
          <button onClick={onDecline}>Decline</button>
        </div>
      </div>

      {/* スレッド全体削除ボタン */}
      <div style={{  marginTop: "10px", textAlign: "left", marginBottom: "8px" }}>
        <button
          style={{ backgroundColor: "#fdd", border: "1px solid #d88", cursor: "pointer" }}
          onClick={onDeleteThread}
        >
          スレッドを削除
        </button>
      </div>
    </div>
  );
};

export default CommentThread;
