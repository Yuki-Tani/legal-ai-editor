'use server'

import { AgentRequest, AgentState } from "./types";

export async function RequestAction(prevState: AgentState, request: AgentRequest): Promise<AgentState> {
  let newType: AgentState["type"];
  let memorySuffix: string;

  if (request.type === "requestOpinion") {
    newType = "answering";
    memorySuffix = `"- 意見を求められたので「完璧だ」と評価した"`;
  } else if (request.type === "requestComment") {
    newType = "commenting";
    memorySuffix = `"- コメントを求められたので「完璧だ」と評価した"`;
  } else {
    return prevState;
  }

  return {
    type: newType,
    answer: `完璧な ${request.draft.length} 文字の文書だと思います。`,
    memory: {
      summary: `${prevState.memory.summary}\n${memorySuffix}`
    }
  };
}