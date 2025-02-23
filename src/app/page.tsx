'use client'
import { DraftContext, useDraftContext } from "./_components/DraftContext";
import DraftEditor from "./_components/DraftEditor";
import styles from "./page.module.css";
import IdeaInterviewPanel from "./_components/IdeaInterviewPanel";
import { useCallback, useState, useTransition } from "react";
import Button from "./_components/Button";
import { AgentPickerAction } from "./api/_agent/AgentPicker";
import { AgentPoolWithoutManager } from "./_types/Agent";
import { Discussion } from "./_types/Discussion";
import DiscussionPanel from "./_components/DiscussionPanel";
import { DraftEditorFocusedRangePopup } from "./_components/DraftEditorPopup";
import { Range, Range as SlateRange } from "slate";

export default function Home() {
  return (
    <div className={styles.home}>
      <DraftContext>
        <HomeContainer />
      </DraftContext>
    </div>
  );
}

function HomeContainer() {
  const [draft, draftAccessor] = useDraftContext();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isPickAgentPending, startPickAgentTransition] = useTransition();

  async function handleGatherOpinion() {
    startPickAgentTransition(async () => {
      const response = await AgentPickerAction({
        request: "文書の性質を考慮して、作成中の文書の問題点を的確に指摘できる可能性の高いエージェントを複数選択せよ。",
        draft,
        candidate: AgentPoolWithoutManager,
      });

      const newDiscussions: Discussion[] = response.agents.map((agent, index) => ({
        id: `${agent.id}-discussion-${discussions.length + index}`,
        title: `${agent.name} が思考中...`,
        baseDraft: draft,
        comments: [],
        commentRequest: {
          id: `comment-${discussions.length}-0`,
          agent,
          type: "pointout",
        },
        isActive: index === 0,
      }));

      setDiscussions((prev) => [...prev, ...newDiscussions]);
    });
  }

  async function handleStartDiscussion() {
    const range = draftAccessor.getCurrentRange();
    if (!range || Range.isCollapsed(range)) {
      console.log("選択範囲がありません。議論を開始できません。");
      return;
    }
    draftAccessor.applySelectionToExpandedRange();

    startPickAgentTransition(async () => {
      const response = await AgentPickerAction({
        request: "以下の範囲について議論してください。（範囲情報は selectedRange を参照）",
        draft,
        candidate: AgentPoolWithoutManager
      });

      const newDiscussions: Discussion[] = response.agents.map((agent, index) => ({
        id: `${agent.id}-discussion-${discussions.length + index}`,
        title: `選択範囲に関する ${agent.name} の議論`,
        baseDraft: draft,
        comments: [],
        commentRequest: {
          id: `comment-${discussions.length + index}-0`,
          agent,
          type: "discuss",
        },
        isActive: index === 0,
        selectedText: draftAccessor.getSelectedText(),
        selectedRange: range,
      }));
      setDiscussions(prev => [...prev, ...newDiscussions]);
    });
  }

  const handleSetDiscussion = useCallback((discussion: Discussion) => {
    setDiscussions(prev =>
      prev.map(d => (d.id === discussion.id ? discussion : d))
    );
  }, []);

  return (
    <div style={{ display: "flex" }}>
      <Content onStartDiscussion={handleStartDiscussion} />
      <DiscussionArea
        discussions={discussions}
        setDiscussion={handleSetDiscussion}
        handleGatherOpinion={handleGatherOpinion}
        isPickAgentPending={isPickAgentPending}
      />
    </div>
  );
}

////////////////////////////////////////////////////////////////////////////////

function Content({
  onStartDiscussion
}: {
  onStartDiscussion: () => void;
}) {
  return (
    <div style={{ flex: 3 }}>
      <DraftEditor
        style={{ minHeight: "90vh" }}
        renderExtensions={({ isEditorFocused, draftAccessor }) => (
          <DraftEditorFocusedRangePopup
            isEditorFocused={isEditorFocused}
            style={{
              margin: 6,
              backgroundColor: "white",
              border: "1px solid black",
              padding: 8,
            }}
          >
            <div>
              <button
                onClick={() => {
                  // ボタン押下で handleStartDiscussion
                  onStartDiscussion();
                }}
              >
                🚩 議論を始める
              </button>
            </div>
          </DraftEditorFocusedRangePopup>
        )}
      />
    </div>
  );
}

////////////////////////////////////////////////////////////////////////////////

export function DiscussionArea({
  discussions,
  setDiscussion,
  handleGatherOpinion,
  isPickAgentPending,
}: {
  discussions: Discussion[];
  setDiscussion: (discussion: Discussion) => void;
  handleGatherOpinion: () => void;
  isPickAgentPending: boolean;
}) {
  const [draft, draftAccessor] = useDraftContext();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={styles.discussion} style={{ flex: 2 }}>
      <Button
        onClick={handleGatherOpinion}
        disabled={draftAccessor.isDraftEmpty()}
        isLoading={isPickAgentPending}
      >
        様々な AI に意見を募る
      </Button>

      <IdeaInterviewPanel isOpen={isOpen} setIsOpen={setIsOpen} />

      {discussions.map((discussion) => (
        <DiscussionPanel
          key={discussion.id}
          discussion={discussion}
          setDiscussion={setDiscussion}
        />
      ))}
    </div>
  );
}