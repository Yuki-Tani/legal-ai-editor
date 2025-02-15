"use client";

import { useState } from "react";
import ChatBox from "./components/ChatBox";
import Chat from "./components/Chat";
import { AgentConfig, defaultAgents } from "../doc-editor/agentConfig";

interface HearingLogData {
  label: string;
  text: string;
}

export default function HearingPage() {
  const [draft, setDraft] = useState("");
  const [hearings, setHearings] = useState<string[]>([]);
  const [chatLog, setChatLog] = useState<HearingLogData[]>([]);
  const [agents, setAgents] = useState<AgentConfig[]>(defaultAgents);

  const handleSubmit = async (
    label: string,
    userRequirement: string,
    draftingAgentName: string
  ) => {
    if (!hearings.length) {
      // await request(label, userRequirement, draftingAgentName);
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

  return (
    <div>
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {chatLog.map((item, idx) => (
          <Chat label={item.label} text={item.text} key={idx}></Chat>
        ))}
        <ChatBox
          handleSubmit={handleSubmit}
          label="文書の種類"
          placeholder="aaa"
          key={chatLog.length}
        />
      </div>
    </div>
  );
}
