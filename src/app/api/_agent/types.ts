import { SelectionRange } from "../../doc-editor/types";

export type AgentMemory = { summary: string };

export type AgentState =
  (
    { type: "silent" } |
    { type: "answering", answer: string } |
    { type: "draft", answer: string } |
    { type: "commenting", answer: string } |
    { type: "suggesting", answer: string }
  )
  & { memory: AgentMemory };

export const initalAgentState: AgentState = { type: "silent", memory: { summary: "" } };

export type AgentRequestType = "requestOpinion" | "requestDraft" | "requestComment" | "requestSuggestion";
export type AgentRequest =
  | { type: "requestOpinion", coreIdea: string, draft: string }
  | { type: "requestDraft", coreIdea: string }
  | { type: "requestComment", coreIdea: string, draft: string, selection: SelectionRange }
  | { type: "requestSuggestion", coreIdea: string, draft: string, selection: SelectionRange };
