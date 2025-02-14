"use client";

import React, { useState } from "react";
import { CommentData } from "../types";
import { AgentConfig } from "../agentConfig";

interface CommentThreadProps {
  selectionId: string;
  selectionText: string;
  comments: CommentData[];
  replacement: string;
  isAccepted: boolean;
  startOffset: number;
  endOffset: number;
  onAddComment: (content: string, author?: string) => void;
  onReplace: () => void;
  onDecline: () => void;
  onUpdateThreadReplacement: (newReplacement: string) => void;
  onDeleteComment: (commentId: string) => void;
  onDeleteThread: () => void;
  agents: AgentConfig[];
  onRequestAgentComment: (agentName: string) => Promise<string>;
  onRequestAgentSuggestion: (agentName: string) => Promise<string>;
}

const CommentThread: React.FC<CommentThreadProps> = ({
  selectionId,
  selectionText,
  comments,
  replacement,
  isAccepted,
  startOffset,
  endOffset,
  onAddComment,
  onReplace,
  onDecline,
  onDeleteComment,
  onDeleteThread,
  onUpdateThreadReplacement,
  agents,
  onRequestAgentComment,
  onRequestAgentSuggestion,
}) => {
  const [inputValue, setInputValue] = useState("");
  const handleSend = () => {
    if (inputValue.trim()) {
      onAddComment(inputValue.trim());
      setInputValue("");
    }
  };

  // AIのコメントを要求
  const commentAgents = agents.filter((ag) => ag.enableRequests.requestComment);
  const [selectedCommentAgent, setSelectedCommentAgent] = useState("");
  const handleRequestComment = async () => {
    if (!selectedCommentAgent) return;
    const aiAnswer = await onRequestAgentComment(selectedCommentAgent);
    console.log("AIのコメント:", aiAnswer);
    if (aiAnswer) {
      onAddComment(aiAnswer, selectedCommentAgent);
    }
  };

  // 提案を要求
  const suggestionAgents = agents.filter((ag) => ag.enableRequests.requestSuggestion);
  const [selectedSuggestionAgent, setSelectedSuggestionAgent] = useState("");
  const handleRequestSuggestion = async () => {
    if (!selectedSuggestionAgent) return;
    // AI提案を取得 → replacementに設定
    const aiSuggestion = await onRequestAgentSuggestion(selectedSuggestionAgent);
    if (aiSuggestion) {
      onUpdateThreadReplacement(aiSuggestion);
    }
  };

  // Accept/Declineボタンの無効化
  const disableAcceptDecline = startOffset === endOffset;

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
      <h4>{selectionText ? selectionText : "AIによるレビュー"}</h4>

      <div 
        style={{ 
          marginTop: "12px",
          borderTop: "1px solid #ddd",
          paddingTop: "8px",
        }}
      >
        <label style={{ display: "block", marginBottom: "4px" }}>
          <strong>
              コメント
          </strong>
        </label>

        {/* 既存コメント一覧 */}
        {comments.map((comment) => (
          <div
            key={comment.id}
            style={{
              marginBottom: "8px",
              paddingBottom: "8px",
            }}
          >
            <strong>{comment.author}:</strong> {comment.content}
            <div style={{ marginTop: "4px", textAlign: "right" }}>
              <button
                style={{ backgroundColor: "#fdd", border: "1px solid #d88" }}
                onClick={() => onDeleteComment(comment.id)}
              >
                コメントを削除
              </button>
            </div>
          </div>
        ))}

        {/* AIにコメントを要求 */}
        <div
          style={{
            marginTop: "8px",
            marginBottom: "16px",
            paddingTop: "8px",
            paddingBottom: "8px",
            display: "flex", 
            justifyContent: "space-between", 
          }}
        >
          <div>
            <select
              value={selectedCommentAgent}
              onChange={(e) => setSelectedCommentAgent(e.target.value)}
            >
              <option value="">AIを選択してください</option>
              {commentAgents.map((ag) => (
                <option key={ag.name} value={ag.name}>
                  {ag.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleRequestComment}
            disabled={!selectedCommentAgent}
            style={{ marginLeft: "8px" }}
          >
            コメント要求
          </button>
        </div>

        {/* 新規コメント追加 (ユーザー手動) */}
        <div style={{ marginTop: "8px" }}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            rows={5}
            style={{ width: "100%" }}
          />
          <div style={{ textAlign: "right" }}>
            <button onClick={handleSend} style={{ marginTop: "4px"}}>
              コメント追加
            </button>
          </div>
        </div>
      </div>

      {/* 提案 */}
      <div style={{ marginTop: "12px", borderTop: "1px solid #ddd", paddingTop: "8px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>
          <strong>
              提案
          </strong>
        </label>
        {/* プルダウン + ボタン */}
        <div
          style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}
        >
          <div>
            <select
              value={selectedSuggestionAgent}
              onChange={(e) => setSelectedSuggestionAgent(e.target.value)}
            >
              <option value="">AIを選択してください</option>
              {suggestionAgents.map((ag) => (
                <option key={ag.name} value={ag.name}>
                  {ag.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleRequestSuggestion}
            disabled={!selectedSuggestionAgent}
            style={{ marginLeft: "8px" }}
          >
            提案を要求
          </button>
        </div>
        <textarea
          rows={10}
          style={{ width: "100%" }}
          value={replacement}
          onChange={(e) => onUpdateThreadReplacement(e.target.value)}
        />
        <div style={{ marginTop: "4px", textAlign: "right" }}>
          <button 
            style={{ marginRight: "8px" }}
            onClick={onReplace}
            disabled={disableAcceptDecline}
          >
            Accept
          </button>
          <button 
            onClick={onDecline}
            disabled={disableAcceptDecline}
          >
            Decline
          </button>
        </div>
      </div>

      {/* スレッド全体削除ボタン */}
      <div style={{ marginTop: "10px", textAlign: "left", marginBottom: "8px" }}>
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
