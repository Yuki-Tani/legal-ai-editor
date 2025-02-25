'use client'
import { DraftContext, useDraftContext } from "./_components/DraftContext";
import DraftEditor from "./_components/DraftEditor";
import styles from "./page.module.css";
import IdeaInterviewPanel from "./_components/IdeaInterviewPanel";
import { useCallback, useEffect, useState, useTransition } from "react";
import { AgentPickerAction } from "./api/_agent/AgentPicker";
import { AgentPoolWithoutManager } from "./_types/Agent";
import { Discussion } from "./_types/Discussion";
import { AutoDiscussionPanel } from "./_components/DiscussionPanel";
import { DraftEditorFocusedRangePopup } from "./_components/DraftEditorPopup";
import { Range, Range as SlateRange } from "slate";
import CommonDraftWriterAction from "@/api/_agent/CommonDraftWriter";

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
  const [interviewRequirements, setInterviewRequirements] = useState<string>();

  async function handleIdeaInterviewComplete(requirements: string) {
    setInterviewRequirements(requirements);
    handleGatherOpinion(requirements);
  }

  async function handleGatherOpinion(requirements: string) {
    startPickAgentTransition(async () => {
      const response = await AgentPickerAction({
        request: "文書の性質を考慮して、作成中の文書の問題点を的確に指摘できる可能性の高いエージェントを複数選択せよ。",
        draft,
        candidate: AgentPoolWithoutManager,
      });

      /*
      const newDiscussions: Discussion[] = response.agents.map((agent, index) => ({
        id: `${agent.id}-discussion-${Date.now()}-${Math.random()}`,
        title: `${agent.name} が思考中...`,
        baseDraft: draft,
        comments: [],
        commentRequest: {
          id: `comment-${discussions.length}-0`,
          agent,
          type: "discuss",
        },
        isActive: index === 0,
        requirements, 
      }));
      setDiscussions((prev) => [...prev, ...newDiscussions]);
      */
     
      //最初の一個のagentだけを選択する
      const newDiscussion: Discussion = {
        id: `${response.agents[0].id}-discussion-${Date.now()}-${Math.random()}`,
        title: `${response.agents[0].name} が思考中...`,
        baseDraft: draft,
        comments: [],
        commentRequest: {
          id: `comment-${discussions.length}-0`,
          agent: response.agents[0],
          type: "discuss",
        },
        isActive: true,
        requirements,
      };
      setDiscussions((prev) => [...prev, newDiscussion]);
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

      /*
      const newDiscussions: Discussion[] = response.agents.map((agent, index) => ({
        id: `${agent.id}-discussion-${Date.now()}-${Math.random()}`,
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
        requirements: interviewRequirements,
      }));
      setDiscussions(prev => [...prev, ...newDiscussions]);
      */
      //最初の一個のagentだけを選択する
      const newDiscussion: Discussion = {
        id: `${response.agents[0].id}-discussion-${Date.now()}-${Math.random()}`,
        title: `${response.agents[0].name} が思考中...`,
        baseDraft: draft,
        comments: [],
        commentRequest: {
          id: `comment-${discussions.length}-0`,
          agent: response.agents[0],
          type: "discuss",
        },
        isActive: true,
        requirements: interviewRequirements,
      };
      setDiscussions((prev) => [...prev, newDiscussion]);
    });
  }

  const handleSetDiscussion = useCallback((newDisc: Discussion) => {
    setDiscussions(prev => {
      const oldDisc = prev.find(d => d.id === newDisc.id);
      const wasCompleted = oldDisc?.isCompleted;
      const updated = prev.map(d => d.id === newDisc.id ? newDisc : d);

      if (newDisc.isCompleted && !wasCompleted) {
        createDraftFromDiscussion(newDisc);
      }
      return updated;
    });
  }, []);

  async function createDraftFromDiscussion(discussion: Discussion) {
    console.log("Creating draft from discussion", discussion);
    const requestText = interviewRequirements || "";
    const response = await CommonDraftWriterAction([], requestText, discussion);
    draftAccessor.replaceDraft(response);
  }

  return (
    <div style={{ display: "flex" }}>
      <Content onStartDiscussion={handleStartDiscussion} />
      <DiscussionArea
        discussions={discussions}
        setDiscussion={handleSetDiscussion}
        handleIdeaInterviewComplete={handleIdeaInterviewComplete}
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
  handleIdeaInterviewComplete,
  isPickAgentPending
}: {
  discussions: Discussion[];
  setDiscussion: (discussion: Discussion) => void;
  handleIdeaInterviewComplete: (requirements: string) => void;
  isPickAgentPending: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={styles.discussion} style={{ flex: 2 }}>
      <IdeaInterviewPanel 
        isOpen={isOpen} 
        setIsOpen={setIsOpen}
        onInterviewComplete={handleIdeaInterviewComplete}
      />

      {discussions.map((discussion) => (
        <AutoDiscussionPanel
          key={discussion.id}
          discussion={discussion}
          setDiscussion={setDiscussion}
        />
      ))}
    </div>
  );
}