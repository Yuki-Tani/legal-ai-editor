
'use client'

import { AgentPool, getAgentIconType } from "@/types/Agent";
import AgentMessage from "./AgentMessage";
import Panel from "./Panel";
import { Discussion } from "@/types/Discussion";
import { useEffect, useState, useTransition } from "react";
import { AgentAction } from "@/api/_agent/AgentPool";
import { NextCommentorPickerAction } from "@/api/_agent/AgentPicker";
import TextArea from "./TextArea";
import Button from "./Button";
import panelStyles from "./Panel.module.css";

const MinAgentLoop = 3;

export default function DiscussionPanel({
  discussion,
  setDiscussion,
} : {
  discussion: Discussion,
  setDiscussion: (discussion: Discussion) => void,
}) {
  const [isThinkPending, startThinkTransition] = useTransition();
  const [isPickAgentPending, startPickAgentTransition] = useTransition();

  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    if (!discussion.isActive || discussion.isCompleted || isThinkPending || isPickAgentPending) { return; }
    if (discussion.comments.length > 10) { return; } // とりあえず、暴走を防ぐため上限を設ける
    if (discussion.commentRequest && discussion.commentRequest.agent.id !== "manager") {
      // commentRequest がある場合は、エージェントを動かす
      startThinkTransition(async () => {
        console.log("request agent action");
        const comment = await AgentAction(discussion);
        setDiscussion({
          ...discussion,
          comments: [...discussion.comments, comment],
          commentRequest: null,
        });
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

  function handleAnswer() {
    setDiscussion({
      ...discussion,
      comments: [...discussion.comments, {
        id: `manager-${discussion.comments.length}`,
        agent: discussion.commentRequest!.agent,
        type: discussion.commentRequest!.type!,
        message: userInput,
      }],
      commentRequest: null,
    });
    setUserInput("");
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
      { (discussion.commentRequest && isThinkPending) &&
        <>
          <hr />
          <AgentMessage
            agentIconType={getAgentIconType(discussion.commentRequest.agent.id)}
            agentName={discussion.commentRequest.agent.name}
          >
            思考中...
          </AgentMessage>
        </> 
      }
      { (isPickAgentPending) &&
        <>
          <hr/>
          <div>...</div>
        </>
      }
      { discussion.commentRequest?.agent.id === "manager" &&
        <div>
          <hr />
          <p>
          {
            discussion.commentRequest?.type === "discuss" ? "ここまでの議論でなにか意見はありますか？" :
            discussion.commentRequest?.type === "suggest" ? "なにか提案はありますか？" :
            discussion.commentRequest?.type === "agree" ? "変更を反映しますか？" :
            ""
          }
          </p>
          <TextArea value={userInput} onChange={setUserInput} />
            <div className={panelStyles.buttons}>
              <Button onClick={handleAnswer}>
                回答
              </Button>
            </div>
        </div>
      }
    </Panel>
  );
}