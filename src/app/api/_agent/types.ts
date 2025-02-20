import { SelectionRange } from "../../doc-editor/types";

export type AgentMemory = { summary: string };

export type AgentState = {
  type: "draft" | "silent" | "answering" | "commenting" | "suggesting" | "multipleComments";
  answer?: string;
  answers?: Array<{ author: string; content: string }>;
  memory: Record<string, any>;
};

export const initalAgentState: AgentState = {
  type: "silent",
  memory: { summary: "" },
};

export type AgentRequestType =
  | "requestOpinion"
  | "requestDraft"
  | "requestComment"
  | "requestSuggestion"
  | "requestIdeaRequirement";

export type AgentRequest =
  | { type: "requestOpinion"; coreIdea: string; draft: string }
  | { type: "requestDraft"; coreIdea: string }
  | {
      type: "requestComment";
      coreIdea: string;
      draft: string;
      selection: SelectionRange;
    }
  | {
      type: "requestSuggestion";
      coreIdea: string;
      draft: string;
      selection: SelectionRange;
    }
  | {
      type: "requestIdeaRequirement";
      label: string;
      userRequirement: string;
    };
