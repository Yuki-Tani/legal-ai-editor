import { initalAgentState } from "../api/_agent/types";
import { RequestAction as RequestActionBaseAI } from "../api/_agent/BaseAI";
import { RequestAction as RequestActionYesman } from "../api/_agent/Yesman";
import { RequestAction as RequestActionHoureiAI } from "../api/_agent/HoureiAI";
import { RequestAction as RequestActionPublicCommentAI } from "../api/_agent/PublicCommentAI";
import { AgentRequestType, AgentState } from "../api/_agent/types";

export interface AgentConfig {
  name: string;
  displayName: string;
  description: string;
  requestAction: (prevState: AgentState, request: any) => Promise<AgentState>;
  enableRequests: Record<AgentRequestType, boolean>;
  state: AgentState;
}

export const defaultAgents: AgentConfig[] = [
  {
    name: "BaseAI",
    displayName: "BaseAI",
    description: "BaseAI Description",
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
    displayName: "Yesman",
    description: "Yesman Description",
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
    displayName: "HoureiAI",
    description: "HoureiAI Description",
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
    name: "PublicCommentAI",
    displayName: "パブコメAI",
    description: "様々な立場からの意見を提供します",
    requestAction: RequestActionPublicCommentAI,
    enableRequests: {
      requestDraft: true,
      requestOpinion: true,
      requestComment: true,
      requestSuggestion: true,
      requestIdeaRequirement: true,
    },
    state: initalAgentState,
  },
];
