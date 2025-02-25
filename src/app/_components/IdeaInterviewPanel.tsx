"use client";
import {useRef, useCallback} from "react";
import IdeaInterviewerAction from "@/api/_agent/IdeaInterviewer";
import { useDraftAccessorContext } from "./DraftContext";
import { Comment, CommentRequest, CommentType, Discussion } from "@/types/Discussion";
import { Agent, AgentPoolWithoutManager, ManagerAgent } from "@/types/Agent";
import DiscussionPanel, { useDiscussion } from "./DiscussionPanel";
import { NextCommentorPickerAction } from "@/api/_agent/AgentPicker";
import { AgentAction } from "@/api/_agent/AgentPool";
import CommonDraftWriterAction from "@/api/_agent/CommonDraftWriter";

const DraftWriter: Agent = {
  id: "draft-writer",
  name: "ドラフト作成 AI",
  description: "文書作成の第一稿となるドラフト文書の作成を助けるエージェントです。",
}

const initialDiscussion: Discussion = {
  id: "interview-disucssion",
  title: "ドラフトの作成",
  baseDraft: [],
  comments: [{
    id: "interview-comment-0",
    agent: DraftWriter,
    type: "discuss",
    message: "私が第一稿の作成をお手伝いできます。作成する文書の種類を教えてください。",
  }],
  commentRequest: {
    id: "interview-comment-1",
    agent: ManagerAgent,
    type: "discuss",
  },
  isActive: true,
};

export default function IdeaInterviewPanel() {
  const draftAccessor = useDraftAccessorContext();
  const draftAiQuestions = useRef<{ id: string, question: string }[]>([]);

  function remainingQuestions(discussion: Discussion): { id: string, question: string } | undefined {
    return draftAiQuestions.current.find(q => !discussion.comments.some(c => c.id === q.id));
  }

  const pickAgent = useCallback(async (discussion: Discussion, lastComment?: Comment) => {
    // Agent の選択
    if (draftAiQuestions.current.some(q => lastComment?.id === q.id)) {
      return { agent: ManagerAgent };
    }
    if (draftAiQuestions.current.length == 0 || remainingQuestions(discussion)) {
      return { agent: DraftWriter };
    }
    if (!discussion.comments.some(c => c.id === "start-asking-ais")) {
      return { agent: DraftWriter };
    }
    if (discussion.comments.at(-1)?.agent.id !== DraftWriter.id && discussion.comments.at(-2)?.agent.id !== DraftWriter.id) {
      return { agent: DraftWriter }; // ２回に１回は DraftWriter が発話する
    }
    if (discussion.comments.at(-1)?.id === "create-draft") {
      return { agent: DraftWriter };
    }
    if (discussion.comments.at(-1)?.id === "draft-created") {
      return undefined;
    }

    const agentPool = AgentPoolWithoutManager.filter(agent => agent.id !== lastComment?.agent.id); // 直前に発話したエージェントは選択肢から除外
    const picked = await NextCommentorPickerAction({ discussion, candidate: agentPool });
    return {
      agent: picked.agent,
      expectedCommentType: "discuss" as CommentType
    }
  }, []);

  const invokeAgent = useCallback(async (discussion: Discussion, request: CommentRequest) => {
    // Agent の発話
    if (request.agent.id === "manager") { return undefined; }
    if (request.agent === DraftWriter) {
      if (draftAiQuestions.current.length === 0) {
        // 質問がなければ作る
        const response = await IdeaInterviewerAction({
          request: JSON.stringify(discussion.comments),
        });
        draftAiQuestions.current = response.requirements.map((req, index) => ({
          id: `question-${index}`,
          question: req,
        }));
      }
      const question = remainingQuestions(discussion);
      if (question) {
        return { id: question.id, agent: DraftWriter, message: question.question, type: "discuss" } as Comment;
      }
      if (!discussion.comments.some(c => c.id === "start-asking-ais")) {
        return { id: "start-asking-ais", agent: DraftWriter, message: "このドラフトを作成するのに必要な情報を、専門家 AI は提供してください。", type: "discuss" } as Comment;
      }
      if (!discussion.comments.some(c => c.id === "ask-common-people")) {
        return { id: "ask-common-people", agent: DraftWriter, message: "なるほど。では、一般の方の視点からはいかがでしょうか。", type: "discuss" } as Comment;
      }
      if (!discussion.comments.some(c => c.id === "create-draft")) {
        return { id: "create-draft", agent: DraftWriter, message: "ありがとうございます。では、ここまでの議論を元にドラフトを作成します。", type: "discuss" } as Comment;
      }
      if (!discussion.comments.some(c => c.id === "draft-created")) {
        const response = await CommonDraftWriterAction([], `以下の Discussion に基づき、詳細なドラフトを作成してください。<discussion>${JSON.stringify(discussion)}</discussion>`);
        draftAccessor.replaceDraft(response);
        return { id: "draft-created", agent: DraftWriter, message: "ドラフトの作成が完了しました。", type: "discuss" } as Comment;
      }
    }
    const agentAction = await AgentAction(discussion);
    return agentAction[0];
  }, [draftAccessor]);

  const [discussion, setDiscussion] = useDiscussion(initialDiscussion, pickAgent, invokeAgent);

  if (!discussion.isCompleted && discussion.comments.some(c => c.id === "draft-created")) {
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
