
'use client'

import { Agent, AgentPool, getAgentIconType, ManagerAgent } from "@/types/Agent";
import AgentMessage from "./AgentMessage";
import Panel from "./Panel";
import { Comment, CommentRequest, CommentType, Discussion } from "@/types/Discussion";
import { useCallback, useEffect, useState, useTransition } from "react";
import { AgentAction } from "@/api/_agent/AgentPool";
import { NextCommentorPickerAction } from "@/api/_agent/AgentPicker";
import TextArea from "./TextArea";
import Button from "./Button";
import panelStyles from "./Panel.module.css";

export default function DiscussionPanel({
  discussion,
  setDiscussion,
} : {
  discussion: Discussion,
  setDiscussion: (discussion: Discussion) => void,
}) {
  const [userInput, setUserInput] = useState("");
  const [isAnswerPending, startAnswerTransition] = useTransition();

  function handleAnswer() {
    if (!discussion.commentRequest) return;
    startAnswerTransition(async () => {
      setDiscussion({
        ...discussion,
        comments: [...discussion.comments, {
          id: `manager-${discussion.comments.length}`,
          agent: ManagerAgent,
          type: "discuss",
          message: userInput,
        }],
        commentRequest: null,
      });
      setUserInput("");
    });
  }

  return (
    <Panel
      title={discussion.title}
      isOpen={discussion.isActive}
      setIsOpen={(isOpen) => setDiscussion({ ...discussion, isActive: isOpen })}
      isComplete={discussion.isCompleted}
    >
      { discussion.comments.map((comment) => (
        <div key={comment.id}>
          <hr />
          <AgentMessage
            key={comment.id}
            agentIconType={getAgentIconType(comment.agent.id)}
            agentName={comment.agent.name}
          >
            {comment.message}
          </AgentMessage>
        </div>
      ))}
      { (discussion.commentRequest && discussion.commentRequest.agent.id !== "manager") &&
        <div>
          <hr />
          <AgentMessage
            agentIconType={getAgentIconType(discussion.commentRequest.agent.id)}
            agentName={discussion.commentRequest.agent.name}
          >
            思考中...
          </AgentMessage>
        </div>
      }
      { discussion.commentRequest && discussion.commentRequest.agent.id === "manager" &&
        <div>
          <hr />
          <TextArea value={userInput} onChange={setUserInput} />
          <div className={panelStyles.buttons}>
            <Button onClick={handleAnswer} isLoading={isAnswerPending}>
              送信
            </Button>
          </div>
        </div>
      }
    </Panel>
  )
}

export function useDiscussion(
  initialDiscussion: Discussion,
  pickAgent: (discussion: Discussion, lastComment?: Comment) => Promise<{ agent: Agent, expectedCommentType?: CommentType } | undefined>,
  invokeAgent: (discussion: Discussion, request: CommentRequest) => Promise<Comment | string | undefined>,
) : [Discussion, /*setDiscussion*/(discussion: Discussion) => void, /*isPickAgentPending*/boolean, /*isInvokeAgentPending*/boolean]
{
  const [discussion, setDiscussion] = useState<Discussion>(initialDiscussion);
  const [isPickAgentPending, startPickAgentTransition] = useTransition();
  const [isInvokeAgentPending, startInvokeAgentTransition] = useTransition();

  useEffect(() => {
    if (!discussion.isActive || discussion.isCompleted) { return; }

    if (!discussion.commentRequest)
    {
      startPickAgentTransition(async () => {
        const next = await pickAgent(
          discussion,
          discussion.comments[discussion.comments.length - 1]
        );
        if (next)
        {
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
        const comment = await invokeAgent(discussion, request);
        if (comment && discussion.commentRequest?.id === request.id)
        {
          if (typeof comment === "string") {
            setDiscussion({
              ...discussion,
              comments: [...discussion.comments, {
                id: request.id,
                agent: request.agent,
                type: request.type ?? "discuss",
                message: comment,
              }],
              commentRequest: null,
            });
          } else {
            setDiscussion({
              ...discussion,
              comments: [...discussion.comments, comment],
              commentRequest: null,
            });
          }
        }
      });
    }
  }, [discussion, pickAgent, invokeAgent]);

  return [discussion, setDiscussion, isPickAgentPending, isInvokeAgentPending] as const;
}

const MinAgentLoop = 3;

export function AutoDiscussionPanel({
  discussion,
  setDiscussion,
} : {
  discussion: Discussion,
  setDiscussion: (discussion: Discussion) => void,
}) {
  const [isThinkPending, startThinkTransition] = useTransition();
  const [isPickAgentPending, startPickAgentTransition] = useTransition();

  useEffect(() => {
    if (!discussion.isActive || discussion.isCompleted || isThinkPending || isPickAgentPending) { return; }

    // とりあえず、暴走を防ぐため上限を設ける
    if (discussion.comments.length > 10) {
      setDiscussion({ ...discussion, isCompleted: true });
      return;
    }
    if (discussion.commentRequest && discussion.commentRequest.agent.id !== "manager") {
      // commentRequest がある場合は、エージェントを動かす
      startThinkTransition(async () => {
        console.log("request agent action");
        const comments = await AgentAction(discussion);
        //　複数のコメントが返ってくる場合は、一つずつ処理する
        for (const comment of comments) {
          setDiscussion({
            ...discussion,
            comments: [...discussion.comments, comment],
            commentRequest: null,
          });
        }
      });
    }
    if (!discussion.commentRequest)
    {
      // commentRequest がない場合は、次の発話エージェントを選択する
      startPickAgentTransition(async () => {
        const candidate = AgentPool.filter(agent =>
          ((discussion.comments.length > MinAgentLoop) ? agent.id !== "" : agent.id !== "manager") && // 最初の数回は manager を選ばない
          discussion.comments[discussion.comments.length - 1]?.agent.id !== agent.id // 直前のエージェントと同じエージェントは選ばない
        );

        // もし candidate が空 => もう誰も発話できない => 終了
        if (candidate.length === 0) {
          console.log("No more candidate. Discussion ends.");
          setDiscussion({ ...discussion, isCompleted: true });
          return;
        }

        const response = await NextCommentorPickerAction({discussion, candidate});
        setDiscussion({
          ...discussion,
          commentRequest: {
            id: `${response.agent.id}-${discussion.comments.length}`,
            agent: response.agent,
            type: response.expectedCommentType
          },
        })
      });
    }
  }, [discussion, isPickAgentPending, isThinkPending, setDiscussion]);

  return (
    <DiscussionPanel
      discussion={discussion}
      setDiscussion={setDiscussion}
    />
  );
}