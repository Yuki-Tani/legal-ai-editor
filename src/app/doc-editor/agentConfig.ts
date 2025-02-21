import { initalAgentState } from "../api/_agent/types";
import { RequestAction as RequestActionBaseAI } from "../api/_agent/BaseAI";
import { RequestAction as RequestActionYesman } from "../api/_agent/Yesman";
import { RequestAction as RequestActionHoureiAI } from "../api/_agent/HoureiAI";
import { RequestAction as RequestActionKeihinJireiAI } from "../api/_agent/KeihinJireiAI";
import { RequestAction as RequestActionPublicCommentAI } from "../api/_agent/PublicCommentAI";
import { RequestAction as RequestActionKinouseiHyoujiSyokuhinAI } from "../api/_agent/KinouseiHyoujiSyokuhinAI";
import { RequestAction as RequestActionTokuteiSyotorihikiJireiAI} from "../api/_agent/TokuteiSyotorihikiJireiAI";
import { RequestAction as RequestActionResearchAI } from "../api/_agent/ResearchAI";
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
    name: "法令AI",
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
    name: "景品表示法事例AI",
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
  {
    name: "PublicCommentAI",
    requestAction: RequestActionPublicCommentAI,
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
    name: "機能性表示食品AI",
    requestAction: RequestActionKinouseiHyoujiSyokuhinAI,
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
    name: "特定商取引違反執行事例AI",
    requestAction: RequestActionTokuteiSyotorihikiJireiAI,
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
    name: "WebリサーチAI",
    requestAction: RequestActionResearchAI,
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
