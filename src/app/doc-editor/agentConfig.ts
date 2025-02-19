import { initalAgentState } from "../api/_agent/types";
import { RequestAction as RequestActionBaseAI } from "../api/_agent/BaseAI";
import { RequestAction as RequestActionYesman } from "../api/_agent/Yesman";
import { RequestAction as RequestActionHoureiAI } from "../api/_agent/HoureiAI";
import { RequestAction as RequestActionKeihinJireiAI } from "../api/_agent/KeihinJireiAI";
import { AgentRequestType, AgentState } from "../api/_agent/types";

export interface AgentConfig {
  name: string;
  requestAction: (prevState: AgentState, request: any) => Promise<AgentState>;
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
      requestIdeaRequirement: true,
    },
    state: initalAgentState,
  },
  {
    name: "Yesman",
    requestAction: RequestActionYesman,
    enableRequests: {
      requestDraft: false,
      requestOpinion: true,
      requestComment: true,
      requestSuggestion: false,
      requestIdeaRequirement: false,
    },
    state: initalAgentState,
  },
  {
    name: "HoureiAI",
    requestAction: RequestActionHoureiAI,
    enableRequests: {
      requestDraft: false,
      requestOpinion: false,
      requestComment: true,
      requestSuggestion: false,
      requestIdeaRequirement: false,
    },
    state: initalAgentState,
  },
  {
    name: "KeihinJireiAI",
    requestAction: RequestActionKeihinJireiAI,
    enableRequests: {
      requestDraft: false,
      requestOpinion: false,
      requestComment: true,
      requestSuggestion: false,
      requestIdeaRequirement: false,
    },
    state: initalAgentState,
  },
];
