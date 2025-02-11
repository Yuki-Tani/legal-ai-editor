
export type AgentMemory = { summary: string };

export type AgentState =
  (
    { type: "silent" } |
    { type: "answering", answer: string }
  )
  & { memory: AgentMemory };

export const initalAgentState: AgentState = { type: "silent", memory: { summary: "" } };

export type AgentRequestType = "requestOpinion";
export type AgentRequest = { type: "requestOpinion", draft: string };