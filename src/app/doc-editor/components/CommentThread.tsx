"use client";

import React, { useState } from "react";
import { CommentData } from "../types";
import { AgentConfig } from "../agentConfig";
import Button from "../../_components/Button";

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
      setCommentButtonKey((prev) => prev + 1);
    }
  };
  const [commentButtonKey, setCommentButtonKey] = useState(0);
  const [requestCommentKey, setRequestCommentKey] = useState(0);
  const [requestSuggestionKey, setRequestSuggestionKey] = useState(0);

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
    setRequestCommentKey((prev) => prev + 1);
  };

  // 提案を要求
  const suggestionAgents = agents.filter(
    (ag) => ag.enableRequests.requestSuggestion
  );
  const [selectedSuggestionAgent, setSelectedSuggestionAgent] = useState("");
  const handleRequestSuggestion = async () => {
    if (!selectedSuggestionAgent) return;
    // AI提案を取得 → replacementに設定
    const aiSuggestion = await onRequestAgentSuggestion(
      selectedSuggestionAgent
    );
    if (aiSuggestion) {
      onUpdateThreadReplacement(aiSuggestion);
    }
    setRequestSuggestionKey((prev) => prev + 1);
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
          <strong>コメント</strong>
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
            <div
              style={{
                marginTop: "4px",
                textAlign: "right",
                fontSize: "0.8em",
              }}
            >
              <Button
                buttonText="コメントを削除"
                handleClicked={() => onDeleteComment(comment.id)}
                notice
              />
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
          <div style={{ textAlign: "right", fontSize: "0.8em" }}>
            <Button
              buttonText="コメント要求"
              handleClicked={handleRequestComment}
              disabled={!selectedCommentAgent}
              useLoadingAnimation
              key={requestCommentKey}
            />
          </div>
        </div>

        {/* 新規コメント追加 (ユーザー手動) */}
        <div style={{ marginTop: "8px" }}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            rows={5}
            style={{ width: "100%" }}
          />
          <div style={{ textAlign: "right", fontSize: "0.8em" }}>
            <Button
              buttonText="コメント追加"
              handleClicked={handleSend}
              onlyOnce
              disabled={!inputValue.length}
              key={commentButtonKey}
            />
          </div>
        </div>
      </div>

      {/* 提案 */}
      <div
        style={{
          marginTop: "12px",
          borderTop: "1px solid #ddd",
          paddingTop: "8px",
        }}
      >
        <label style={{ display: "block", marginBottom: "4px" }}>
          <strong>提案</strong>
        </label>
        {/* プルダウン + ボタン */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
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
          <div style={{ textAlign: "right", fontSize: "0.8em" }}>
            <Button
              buttonText="提案を要求"
              handleClicked={handleRequestSuggestion}
              key={requestSuggestionKey}
              disabled={!selectedSuggestionAgent}
              useLoadingAnimation
            />
          </div>
        </div>
        <textarea
          rows={10}
          style={{ width: "100%" }}
          value={replacement}
          onChange={(e) => onUpdateThreadReplacement(e.target.value)}
        />
        <div
          style={{
            marginTop: "4px",
            textAlign: "right",
            display: "flex",
            justifyContent: "flex-end",
            fontSize: "0.85em",
          }}
        >
          <Button
            buttonText="Accept"
            handleClicked={onReplace}
            disabled={disableAcceptDecline || !replacement.length}
          />
          <Button
            buttonText="Decline"
            handleClicked={onDecline}
            disabled={disableAcceptDecline || !replacement.length}
          />
        </div>
      </div>

      {/* スレッド全体削除ボタン */}
      <div
        style={{
          marginTop: "10px",
          textAlign: "left",
          marginBottom: "8px",
          fontSize: "0.8em",
        }}
      >
        <Button
          buttonText="スレッドを削除"
          handleClicked={onDeleteThread}
          notice
        />
      </div>
    </div>
  );
};

export default CommentThread;
