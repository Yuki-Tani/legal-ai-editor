"use client";
import { DraftContext, useDraftAccessorContext } from "./_components/DraftContext";
import DraftEditor from "./_components/DraftEditor";
import styles from "./page.module.css";
import DraftCreationPanel from "./_components/DraftCreationPanel";
import { useState } from "react";
import { DraftEditorFocusedRangePopup } from "./_components/DraftEditorPopup";
import { Range } from "slate";
import DraftUpdatePanel from "./_components/DraftUpdatePanel";

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
  const draftAccessor = useDraftAccessorContext();
  const [discussionIds, setDiscussionIds] = useState<string[]>([]);

  async function handleStartDiscussion() {
    const range = draftAccessor.getCurrentRange();
    if (!range || Range.isCollapsed(range)) {
      console.log("選択範囲がありません。議論を開始できません。");
      return;
    }
    draftAccessor.applySelectionToExpandedRange();

    const discussionId = `discussion-${discussionIds.length}`;
    setDiscussionIds([...discussionIds, discussionId]);
  }

  return (
    <div style={{ display: "flex" }}>
      <Content onStartDiscussion={handleStartDiscussion} />
      <DiscussionArea discussionIds={discussionIds}/>
    </div>
  );
}

////////////////////////////////////////////////////////////////////////////////

function Content({ onStartDiscussion }: { onStartDiscussion: () => void }) {
  return (
    <div style={{ flex: 3 }}>
      <DraftEditor
        style={{ minHeight: "90vh" }}
        renderExtensions={({ isEditorFocused }) => (
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
              <button onClick={onStartDiscussion}>
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

export function DiscussionArea({ discussionIds }: { discussionIds: string[] }) {
  return (
    <div className={styles.discussion} style={{ flex: 2 }}>
      <DraftCreationPanel />
      {discussionIds.map((discussionId) => (
        <DraftUpdatePanel key={discussionId} />
      ))}
    </div>
  );
}
