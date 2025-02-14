'use client';

import { startTransition, useActionState, useState, useTransition } from "react";
import { v4 as uuidv4 } from "uuid";
import Editor from "./components/Editor";
import CommentSidebar from "./components/CommentSidebar";
import { RequestAction as RequestActionBaseAI } from "../api/_agent/BaseAI";
import { RequestAction as RequestActionYesman } from "../api/_agent/Yesman";
import { AgentState, AgentRequestType, initalAgentState } from "../api/_agent/types";
import { SelectionRange, CommentData } from "./types";
import { defaultAgents, AgentConfig } from "./agentConfig";

export default function DocEditorPage() {
  const [coreIdea, setCoreIdea] = useState("");
  const [draft, setDraft] = useState("");
  const [selections, setSelections] = useState<SelectionRange[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [agents, setAgents] = useState<AgentConfig[]>(defaultAgents);

  const handleStartDiscussion = async (draftingAgentName: string) => {
    try {
      const agentIndex = agents.findIndex(
        (ag) => ag.name === draftingAgentName
      );
      if (agentIndex < 0) {
        console.error("No such agent:", draftingAgentName);
        return;
      }
      const draftingAgent = agents[agentIndex];

      if (!draftingAgent.enableRequests.requestDraft) {
        console.error(
          `Agent ${draftingAgentName} is not enabled for requestDraft.`
        );
        return;
      }

      const newDraftState = await draftingAgent.requestAction(
        draftingAgent.state,
        {
          type: "requestDraft",
          coreIdea,
        }
      );
      if (newDraftState.type === "draft") {
        const newDraft = newDraftState.answer;
        setDraft(newDraft);
        updateAgentState(draftingAgentName, newDraftState);

        for (const ag of agents) {
          if (ag.enableRequests.requestOpinion) {
            const opinionState = await ag.requestAction(ag.state, {
              type: "requestOpinion",
              coreIdea,
              draft: newDraft,
            });
            updateAgentState(ag.name, opinionState);
            if (opinionState.type === "answering") {
              createCommentThread(
                `${ag.name}'のコメント`,
                ag.name,
                opinionState.answer
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in handleStartDiscussion:", error);
    }
  };

  const updateAgentState = (agentName: string, newState: any) => {
    setAgents((prev) =>
      prev.map((ag) =>
        ag.name === agentName ? { ...ag, state: newState } : ag
      )
    );
  };

  const createCommentThread = (
    threadTitle: string,
    author: string,
    content: string
  ) => {
    const newThread: SelectionRange = {
      id: uuidv4(),
      text: threadTitle,
      startOffset: 0,
      endOffset: 0,
      comments: [
        {
          id: uuidv4(),
          author,
          content,
        },
      ],
      replacement: "",
      isAccepted: false,
    };
    setSelections((prev) => [...prev, newThread]);
  };

  const handleContentChange = (content: string) => {
    setDraft(content);
  };

  // 選択時に新規スレッド生成
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
      replacement: "",
      isAccepted: false,
    };
    setSelections((prev) => [...prev, newSelection]);
  };

  // コメント追加
  const handleAddComment = (selectionId: string, content: string) => {
    setSelections((prev) =>
      prev.map((sel) => {
        if (sel.id === selectionId) {
          const newComment: CommentData = {
            id: uuidv4(),
            author: "User",
            content,
          };
          return {
            ...sel,
            comments: [...sel.comments, newComment],
          };
        }
        return sel;
      })
    );
  };

  // Replacementの編集
  const handleUpdateThreadReplacement = (
    selectionId: string,
    newReplacement: string
  ) => {
    setSelections((prev) =>
      prev.map((sel) =>
        sel.id === selectionId
          ? { ...sel, replacement: newReplacement }
          : sel
      )
    );
  };

  // Accept: テキスト置換＆スレッドを無効化
  const handleReplaceSelection = (selectionId: string) => {
    const targetSelection = selections.find((sel) => sel.id === selectionId);
    if (!targetSelection) return;

    // テキストを置換
    const before = draft.slice(0, targetSelection.startOffset);
    const after = draft.slice(targetSelection.endOffset);
    const newDraft = before + targetSelection.replacement + after;
    setDraft(newDraft);

    // isAccepted = true で無効化
    setSelections((prev) =>
      prev.map((sel) =>
        sel.id === selectionId
          ? { ...sel, isAccepted: true }
          : sel
      )
    );
  };

  // Decline: replacementを空に
  const handleDeclineSelection = (selectionId: string) => {
    setSelections((prev) =>
      prev.map((sel) =>
        sel.id === selectionId
          ? { ...sel, replacement: "" }
          : sel
      )
    );
  };

  // コメント削除
  const handleDeleteComment = (selectionId: string, commentId: string) => {
    setSelections((prev) =>
      prev.map((sel) => {
        if (sel.id === selectionId) {
          return {
            ...sel,
            comments: sel.comments.filter((c) => c.id !== commentId),
          };
        }
        return sel;
      })
    );
  };

  // スレッド削除
  const handleDeleteThread = (selectionId: string) => {
    setSelections((prev) => prev.filter((sel) => sel.id !== selectionId));
  };

  // サイドバー開閉
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div
        style={{
          flex: 1,
          padding: "16px",
          marginRight: isSidebarOpen ? "320px" : "40px",
          transition: "margin-right 0.3s",
        }}
      >
        {/* コアアイデア・要件 */}
        <div style={{ position: "relative", marginBottom: "100px", zIndex: 10 }}>
          <label>コアアイデア・要件:</label>
          <textarea
            rows={3}
            style={{ width: "100%", marginTop: "8px" }}
            value={coreIdea}
            onChange={(e) => setCoreIdea(e.target.value)}
          />
          {/* ディスカッション開始 */}
          <button
            style={{ marginTop: "8px", float: "right" }}
            onClick={() => handleStartDiscussion("BaseAI")}
          >
            ディスカッションを開始
          </button>
        </div>

        {/* Editor */}
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
        onDeclineSelection={handleDeclineSelection}
        onDeleteComment={handleDeleteComment}
        onDeleteThread={handleDeleteThread}
        onUpdateThreadReplacement={handleUpdateThreadReplacement}
      />
    </div>
  );
}
