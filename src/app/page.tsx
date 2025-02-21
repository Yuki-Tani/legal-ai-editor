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

export default function Home() {
  return (
    <div className={styles.home}>
      <DraftContext>
        <div style={{ display: "flex" }}>
          <Content />
          <DiscussionArea />
        </div>
      </DraftContext>
    </div>
  );
}

export function Content() {
  return (
    <div className={styles.content} style={{ flex: 3 }}>
      <DraftEditor style={{ minHeight: '90vh' }}/>
    </div>
  );
}

export function DiscussionArea() {
  const [draft, draftAccessor] = useDraftContext();
  const [isOpen, setIsOpen] = useState(true);
  const [isPickAgentPending, startPickAgentTransition] = useTransition();

  const [discussions, setDiscussions] = useState<Discussion[]>([]);

  async function handleGatherOpinion() {
    startPickAgentTransition(async () => {
      const response = await AgentPickerAction({
        request: "文書の性質を考慮して、作成中の文書の問題点を的確に指摘できる可能性の高いエージェントを複数選択せよ。",
        draft: draft,
        candidate: AgentPoolWithoutManager
      });
      const newDiscussions: Discussion[] = response.agents.map((agent, index) => ({
        id: `${agent.id}-discussion-${discussions.length + index}`,
        title: `${agent.name} が思考中...`,
        baseDraft: draft,
        comments: [],
        commentRequest: {id: `comment-${discussions.length}-0`, agent, type: "pointout"},
        isActive: (index == 0)
      }));
      setDiscussions([...discussions, ...newDiscussions]);
    });
  }

  const handleSetDiscussion = useCallback((discussion: Discussion) => {
    setDiscussions(discussions.map(d => d.id === discussion.id ? discussion : d));
  }, [discussions]);

  return (
    <div className={styles.discussion} style={{ flex: 2 }}>
      <Button onClick={handleGatherOpinion} disabled={draftAccessor.isDraftEmpty()} isLoading={isPickAgentPending}>
        様々な AI に意見を募る
      </Button>

      <IdeaInterviewPanel isOpen={isOpen} setIsOpen={setIsOpen} />

      { discussions.map(discussion => (
        <DiscussionPanel
          key={discussion.id}
          discussion={discussion}
          setDiscussion={handleSetDiscussion}
        />
      ))
      }
    </div>
  );
}