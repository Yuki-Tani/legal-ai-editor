'use server'

import { AgentRequest, AgentState } from "./types";

export async function RequestAction(prevState: AgentState, request: AgentRequest): Promise<AgentState> {

  if (request.type === "requestOpinion") {
    return {
      type: "answering",
      answer: `完璧な ${request.draft.length} 文字の文書だと思います。`,
      memory: {
        summary: `${prevState.memory.summary}\n"- 意見を求められたので「完璧だ」と評価した"`
      }
    };
  }

  return prevState;
}