"use client";

import { Agent, getAgentIconType, ManagerAgent } from "@/types/Agent";
import AgentMessage from "./AgentMessage";
import Panel from "./Panel";
import { Comment, CommentRequest, CommentType, Discussion } from "@/types/Discussion";
import { useEffect, useState, useTransition } from "react";
import TextArea from "./TextArea";
import Button from "./Button";
import panelStyles from "./Panel.module.css";

export type AgentInvokeResult =
  | { comments?: Comment[]; discussionPatch?: Partial<Discussion> }
  | string
  | undefined;

export default function DiscussionPanel({
  discussion,
  setDiscussion,
}: {
  discussion: Discussion;
  setDiscussion: (discussion: Discussion) => void;
}) {
  const [userInput, setUserInput] = useState("");
  const [isAnswerPending, startAnswerTransition] = useTransition();

  function handleAnswer() {
    if (!discussion.commentRequest) return;
    startAnswerTransition(async () => {
      setDiscussion({
        ...discussion,
        comments: [
          ...discussion.comments,
          {
            id: `manager-${discussion.comments.length}`,
            agent: ManagerAgent,
            type: "discuss",
            message: userInput,
          },
        ],
        commentRequest: null,
      });
      setUserInput("");
    });
  }

  function handleApply(comment: Comment) {
    if (!discussion.commentRequest) return;
    startAnswerTransition(async () => {
      setDiscussion({
        ...discussion,
        comments: [
          ...discussion.comments,
          {
            id: `manager-${discussion.comments.length}`,
            agent: ManagerAgent,
            type: "agree",
            message: `${comment.agent.name} の提案にしたがって、ドラフトを更新します。`,
          },
        ],
        commentRequest: null,
      });
    });
  }

  return (
    <Panel
      title={discussion.title}
      isOpen={discussion.isActive}
      setIsOpen={(isOpen) => setDiscussion({ ...discussion, isActive: isOpen })}
      isComplete={discussion.isCompleted}
    >
      {discussion.comments.map((comment) => (
        <div key={comment.id}>
          <hr />
          <AgentMessage
            agentIconType={getAgentIconType(comment.agent.id)}
            agentName={comment.agent.name}
          >
            {comment.message}
          </AgentMessage>
          {comment.type === "suggest" && (
            <div className={panelStyles.buttons}>
              <Button
                onClick={() => handleApply(comment)}
                isLoading={isAnswerPending}
                disabled={discussion.commentRequest?.agent.id !== "manager"}
              >
                この変更を適用する
              </Button>
            </div>
          )}
        </div>
      ))}

      {discussion.commentRequest && discussion.commentRequest.agent.id !== "manager" && (
        <div>
          <hr />
          <AgentMessage
            agentIconType={getAgentIconType(discussion.commentRequest.agent.id)}
            agentName={discussion.commentRequest.agent.name}
          >
            思考中...
          </AgentMessage>
        </div>
      )}

      {discussion.commentRequest && discussion.commentRequest.agent.id === "manager" && (
        <div>
          <hr />
          <TextArea value={userInput} onChange={setUserInput} />
          <div className={panelStyles.buttons}>
            <Button onClick={handleAnswer} isLoading={isAnswerPending}>
              送信
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );
}

export function useDiscussion(
  initialDiscussion: Discussion,
  pickAgent: (
    discussion: Discussion,
    lastComment?: Comment
  ) => Promise<{ agent: Agent; expectedCommentType?: CommentType } | undefined>,
  invokeAgent: (discussion: Discussion, request: CommentRequest) => Promise<AgentInvokeResult>
): [Discussion, (d: Discussion) => void, boolean, boolean] {
  const [discussion, setDiscussion] = useState<Discussion>(initialDiscussion);
  const [isPickAgentPending, startPickAgentTransition] = useTransition();
  const [isInvokeAgentPending, startInvokeAgentTransition] = useTransition();

  useEffect(() => {
    if (!discussion.isActive || discussion.isCompleted) {
      return;
    }

    if (!discussion.commentRequest) {
      startPickAgentTransition(async () => {
        const next = await pickAgent(
          discussion,
          discussion.comments[discussion.comments.length - 1]
        );
        if (next) {
          setDiscussion({
            ...discussion,
            commentRequest: {
              id: `comment-${discussion.comments.length}`,
              agent: next.agent,
              type: next.expectedCommentType,
            },
          });
        }
      });
    }

    if (discussion.commentRequest) {
      const request = discussion.commentRequest;
      startInvokeAgentTransition(async () => {
        const agentResult = await invokeAgent(discussion, request);
        if (agentResult && discussion.commentRequest?.id === request.id) {
          if (typeof agentResult === "string") {
            setDiscussion({
              ...discussion,
              comments: [
                ...discussion.comments,
                {
                  id: request.id,
                  agent: request.agent,
                  type: request.type ?? "discuss",
                  message: agentResult,
                },
              ],
              commentRequest: null,
            });
          }
          else if ("comments" in agentResult || "discussionPatch" in agentResult) {
            setDiscussion({
              ...discussion,
              comments: [
                ...discussion.comments,
                ...(agentResult.comments ?? []),
              ],
              ...(agentResult.discussionPatch ?? {}),
              commentRequest: null,
            });
          }
          else {
            const comments = agentResult as Comment[];
            setDiscussion({
              ...discussion,
              comments: [...discussion.comments, ...comments],
              commentRequest: null,
            });
          }
        }
      });
    }
  }, [discussion, pickAgent, invokeAgent]);

  return [discussion, setDiscussion, isPickAgentPending, isInvokeAgentPending];
}
