"use client";

import React from "react";
import { SelectionRange } from "../types";
import CommentThread from "./CommentThread";
import { AgentConfig } from "../agentConfig";

interface CommentSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  selections: SelectionRange[];

  agents: AgentConfig[];
  onRequestAgentComment: (agentName: string, selectionId: string) => Promise<string>;
  onRequestAgentSuggestion: (agentName: string, selectionId: string) => Promise<string>;

  onAddComment: (selectionId: string, content: string, author?: string) => void;
  onReplaceSelection: (selectionId: string) => void;
  onDeclineSelection: (selectionId: string) => void;
  onDeleteComment: (selectionId: string, commentId: string) => void;
  onDeleteThread: (selectionId: string) => void;
  onUpdateThreadReplacement: (selectionId: string, newReplacement: string) => void;
}

const CommentSidebar: React.FC<CommentSidebarProps> = ({
  isOpen,
  toggleSidebar,
  selections,
  agents,
  onRequestAgentComment,
  onRequestAgentSuggestion,
  onAddComment,
  onReplaceSelection,
  onDeclineSelection,
  onDeleteComment,
  onDeleteThread,
  onUpdateThreadReplacement,
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
        overflowY: "auto",
      }}
    >
      {/* トグルボタン */}
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

      {isOpen && (
        <div style={{ marginTop: "40px" }}>
          <h3>コメントスレッド</h3>
          {selections.length === 0 && <p>コメントはありません</p>}

          {selections.map((selection) => (
            <CommentThread
              key={selection.id}
              selectionId={selection.id}
              selectionText={selection.text}
              startOffset={selection.startOffset}
              endOffset={selection.endOffset}
              comments={selection.comments}
              replacement={selection.replacement}
              isAccepted={selection.isAccepted}

              agents={agents}
              onRequestAgentComment={(agentName) =>
                onRequestAgentComment(agentName, selection.id)
              }
              onRequestAgentSuggestion={(agentName) =>
                onRequestAgentSuggestion(agentName, selection.id)
              }

              onAddComment={(content, author) =>
                onAddComment(selection.id, content, author)
              }
              onReplace={() => onReplaceSelection(selection.id)}
              onDecline={() => onDeclineSelection(selection.id)}
              onDeleteComment={(commentId) => onDeleteComment(selection.id, commentId)}
              onDeleteThread={() => onDeleteThread(selection.id)}
              onUpdateThreadReplacement={(newRep) =>
                onUpdateThreadReplacement(selection.id, newRep)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSidebar;
