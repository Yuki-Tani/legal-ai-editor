'use client';

import { startTransition, useActionState, useState, useTransition } from "react";
import { v4 as uuidv4 } from "uuid";
import Editor from "./components/Editor";
import CommentSidebar from "./components/CommentSidebar";
import { SelectionRange } from "./types";
import { RequestAction as ReqeustActionToBaseAI } from "../api/_agent/BaseAI";
import { initalAgentState } from "../api/_agent/types";

export default function DocEditorPage() {
  const [coreIdea, setCoreIdea] = useState("");
  const [draft, setDraft] = useState("");
  const [selections, setSelections] = useState<SelectionRange[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [baseAIState, requestBaseAI, isBaseAIPending] = useActionState(ReqeustActionToBaseAI, initalAgentState);

  const handleStartDiscussion = async () => {
    try {
        console.log("Requesting BaseAI to start discussion...");
        const newState = await ReqeustActionToBaseAI(baseAIState, {
            type: "requestDraft",
            coreIdea,
        });
        if (newState.type === "draft") {
            setDraft(newState.answer);
        }
      } catch (error) {
        console.error("Error calling BaseAI RequestAction:", error);
      }
  };

  const handleContentChange = (content: string) => {
    setDraft(content);
  };

  const handleTextSelect = (
    selectedText: string,
    startOffset: number,
    endOffset: number
  ) => {
    if (startOffset === -1) return;
    const newSelection: SelectionRange = {
      id: uuidv4(),
      text: selectedText,
      startOffset,
      endOffset,
      comments: [],
    };
    setSelections((prev) => [...prev, newSelection]);
  };

  const handleAddComment = (selectionId: string, content: string) => {
    setSelections((prev) =>
      prev.map((sel) => {
        if (sel.id === selectionId) {
          return {
            ...sel,
            comments: [
              ...sel.comments,
              {
                id: uuidv4(),
                author: "User",
                content,
              },
            ],
          };
        }
        return sel;
      })
    );
  };

  const handleReplaceSelection = (selectionId: string, replacement: string) => {
    const targetSelection = selections.find((sel) => sel.id === selectionId);
    if (!targetSelection) return;

    const before = draft.slice(0, targetSelection.startOffset);
    const after = draft.slice(targetSelection.endOffset);
    const newDraft = before + replacement + after;
    setDraft(newDraft);
    setSelections((prev) => prev.filter((sel) => sel.id !== selectionId));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      {/* メインコンテンツ：サイドバー分の余白を右側に確保 */}
      <div
        style={{
          flex: 1,
          padding: "16px",
          marginRight: isSidebarOpen ? "320px" : "40px",
          transition: "margin-right 0.3s",
        }}
      >
        <div style={{ position: "relative", zIndex: 10}}>
          <label>コアアイデア・要件:</label>
          <textarea
            rows={3}
            style={{ width: "100%", marginTop: "8px" }}
            value={coreIdea}
            onChange={(e) => setCoreIdea(e.target.value)}
          />
          {/* ディスカッション開始ボタン、右寄せ */}
          <button onClick={handleStartDiscussion} style={{ marginTop: "8px", marginBottom: "70px", float: "right" }}>
            ディスカッションを開始
          </button>
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <Editor
            content={draft}
            onContentChange={handleContentChange}
            onTextSelect={handleTextSelect}
          />
        </div>
      </div>

      {/* コメントサイドバー */}
      <CommentSidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        selections={selections}
        onAddComment={handleAddComment}
        onReplaceSelection={handleReplaceSelection}
      />
    </div>
  );
}
