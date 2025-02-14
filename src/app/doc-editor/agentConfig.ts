import { initalAgentState } from "../api/_agent/types";
import { RequestAction as RequestActionBaseAI } from "../api/_agent/BaseAI";
import { RequestAction as RequestActionYesman } from "../api/_agent/Yesman";
import { AgentRequestType, AgentState } from "../api/_agent/types";

export interface AgentConfig {
  name: string;
  requestAction: (
    prevState: AgentState,
    request: any
  ) => Promise<AgentState>;
  enableRequests: Record<AgentRequestType, boolean>;
  state: AgentState;
}

export const defaultAgents: AgentConfig[] = [
  {
    name: "BaseAI",
    requestAction: RequestActionBaseAI,
    enableRequests: {
      requestDraft: true,
      requestOpinion: true,
      requestComment: true,
      requestSuggestion: true,
    },
    state: initalAgentState,
  },
  {
    name: "Yesman",
    requestAction: RequestActionYesman,
    enableRequests: {
      requestDraft: false,
      requestOpinion: true,
      requestComment: false,
      requestSuggestion: false,
    },
    state: initalAgentState,
  },
];
