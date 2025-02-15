"use client";

import { useEffect, useState } from "react";
import ChatBox from "./components/ChatBox";
import Chat from "./components/Chat";
import { AgentConfig, defaultAgents } from "../doc-editor/agentConfig";
import styles from "./page.module.css";

interface HearingLogData {
  label: string;
  text: string;
}

export default function HearingPage() {
  const [draftIdea, setDraftIdea] = useState("");
  const [hearings, setHearings] = useState<string[]>(["文書の種類"]);
  const [chatLog, setChatLog] = useState<HearingLogData[]>([]);
  const [agents, setAgents] = useState<AgentConfig[]>(defaultAgents);

  const handleSubmit = async (
    label: string,
    userRequirement: string,
    draftingAgentName: string
  ) => {
    if (!chatLog.length) {
      await request(label, userRequirement, draftingAgentName);
    }

    setChatLog((prev) => [...prev, { label: label, text: userRequirement }]);
  };

  const request = async (
    label: string,
    userRequirement: string,
    draftingAgentName: string
  ) => {
    try {
      const draftingAgent = agents.find((ag) => ag.name === draftingAgentName);
      if (!draftingAgent) {
        console.error("No such agent:", draftingAgentName);
        return;
      }
      if (!draftingAgent.enableRequests.requestDraft) {
        console.error(
          `Agent ${draftingAgentName} is not enabled for requestDraft.`
        );
        return;
      }
      console.log(`submit: [${label}: ${userRequirement}]`);

      const newDraftState = await draftingAgent.requestAction(
        draftingAgent.state,
        {
          type: "requestIdeaRequirement",
          label: label,
          userRequirement: userRequirement,
        }
      );

      if (newDraftState.type === "answering") {
        console.log(`answer: ${newDraftState.answer}`);
        const parsedContent: { requirements: string[] } = JSON.parse(
          newDraftState.answer
        );
        setHearings((prev) => [...prev, ...parsedContent.requirements]);
      }
    } catch (error) {
      console.error("Error in handleStartDiscussion:", error);
    }
  };

  const startDiscussion = hearings.length == chatLog.length;

  useEffect(() => {
    if (startDiscussion) {
      const coreIdea: string = chatLog
        .map((item) => `${item.label}: ${item.text}`)
        .join("\n\n");
      setDraftIdea(coreIdea);
    }
  }, [chatLog]);

  const handleIdeaSubmit = () => {
    console.log(draftIdea);

    // create draft
  };

  return (
    <div>
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
        }}
        className={styles.hearing_page_container}
      >
        <div className={styles.chat_log}>
          {chatLog.map((item, idx) => (
            <Chat label={item.label} text={item.text} key={idx} />
          ))}
        </div>
        {!startDiscussion ? (
          <ChatBox
            handleSubmit={handleSubmit}
            label={hearings[chatLog.length]}
            placeholder=""
            key={chatLog.length}
          />
        ) : (
          <div style={{ padding: "10px" }}>
            この内容でドラフトを作成します！
            <br />
            {chatLog.map((item, idx) => (
              <div key={idx}>{`${item.label}: ${item.text}`}</div>
            ))}
            <button onClick={handleIdeaSubmit}>Go</button>
          </div>
        )}
      </div>
    </div>
  );
}
