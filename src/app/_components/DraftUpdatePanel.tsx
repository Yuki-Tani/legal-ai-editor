"use client";
import {useRef, useCallback} from "react";
import { useDraftAccessorContext } from "./DraftContext";
import { CommentRequest, CommentType, Discussion } from "@/types/Discussion";
import { Agent, AgentPoolWithoutManager, ManagerAgent } from "@/types/Agent";
import DiscussionPanel, { useDiscussion } from "./DiscussionPanel";
import { NextCommentorPickerAction } from "@/api/_agent/AgentPicker";
import { AgentAction } from "@/api/_agent/AgentPool";
import CommonDraftUpdaterAction from "@/api/_agent/CommonDraftUpdater";

const DraftUpdater: Agent = {
  id: "draft-updater",
  name: "ドラフト更新 AI",
  description: "ここまでのディスカッションの内容を元に、ドラフトの更新を作成する AI です。",
}

export default function DraftUpdatePanel({discussionId}: {discussionId: string}) {
  const draftAccessor = useDraftAccessorContext();
  const initialDiscussion = useRef<Discussion>(null);
  if (!initialDiscussion.current) {
    initialDiscussion.current = {
      id: discussionId,
      title: "選択部分についての議論",
      baseDraft: draftAccessor.editor.children,
      comments: [{
        id: "manager-comment-0",
        agent: ManagerAgent,
        type: "discuss",
        message: "この選択部分についての議論を開始します。",
      }],
      commentRequest: {
        id: "manager-comment-1",
        agent: ManagerAgent,
        type: "discuss",
      },
      selectedText: draftAccessor.getSelectedText().join("\n"),
      isActive: true,
      requirements: [
        "ドラフト内の選択部分 (selected 部分) をより良くするために議論を行い、変更の方向性を提案をせよ。"
      ]
    };
  }

  const pickAgent = useCallback(async (discussion: Discussion) => {
    // Agent の選択
    console.log(discussion);
    if (discussion.comments.at(-1)?.agent.id === ManagerAgent.id && discussion.comments.at(-1)?.type === "agree") {
      return { agent: ManagerAgent, expectedCommentType: "agree"};
    }
    if (discussion.comments.at(-1)?.agent.id === DraftUpdater.id) {
      return { agent: ManagerAgent, expectedCommentType: "discuss"};
    }
    if (discussion.comments.at(-1)?.agent.id !== ManagerAgent.id && discussion.comments.at(-2)?.agent.id !== ManagerAgent.id) {
      return { agent: DraftUpdater, type: "suggest"};
    }

    const agentPool = AgentPoolWithoutManager.filter(agent => agent.id !== discussion.comments.at(-1)?.agent.id); // 直前に発話したエージェントは選択肢から除外
    const picked = await NextCommentorPickerAction({ discussion, candidate: agentPool });
    return {
      agent: picked.agent,
      expectedCommentType: "discuss" as CommentType,
    };
  }, []);

  const invokeAgent = useCallback(async (discussion: Discussion, request: CommentRequest) => {
    // Agent の発話
    console.log(request);
    if (request.agent.id === ManagerAgent.id && request.type === "agree" && !discussion.comments.find(c => c.id === "update-draft")) {
      console.log("apply suggestion...");
      draftAccessor.applySuggestion();
      return { id: "update-draft", agent: ManagerAgent, type: "agree" as CommentType, message: "ドラフトを更新しました。" };
    }
    if (request.agent.id === ManagerAgent.id) { return undefined; }
    if (request.agent.id === DraftUpdater.id) {
      const response = await CommonDraftUpdaterAction(discussion.baseDraft, discussion);
      draftAccessor.createSuggestion(response.updates);
      return { id: request.id, agent: DraftUpdater, type: "suggest" as CommentType, message: "ドラフトの更新例を作成しました。" };
    }
    const agentAction = await AgentAction(discussion);
    return agentAction[0];
  }, [draftAccessor]);

  const [discussion, setDiscussion] = useDiscussion(initialDiscussion.current, pickAgent, invokeAgent);

  if (!discussion.isCompleted && discussion.comments.find(c => c.id === "update-draft")) {
    setDiscussion({
      ...discussion,
      isCompleted: true,
    });
  }

  return (
    <DiscussionPanel
      discussion={discussion}
      setDiscussion={setDiscussion}
    />
  );
}
