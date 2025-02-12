
export type AgentMemory = { summary: string };

export type AgentState =
  (
    { type: "silent" } |
    { type: "answering", answer: string } |
    { type: "draft", answer: string }
  )
  & { memory: AgentMemory };

export const initalAgentState: AgentState = { type: "silent", memory: { summary: "" } };

export type AgentRequestType = "requestOpinion" | "requestDraft";
export type AgentRequest =
  | { type: "requestOpinion", draft: string }
  | { type: "requestDraft", coreIdea: string };
