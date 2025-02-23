import { Comment, Discussion } from "@/types/Discussion";
import { RequestAction as BaseAIAction } from "./BaseAI";
import { RequestAction as HoureiAIAction } from "./HoureiAI";
import { RequestAction as KeihinJireiAIAction } from "./KeihinJireiAI";
import { RequestAction as KinouseiHyoujiSyokuhinAIAction } from "./KinouseiHyoujiSyokuhinAI";
import { RequestAction as TokuteiSyotorihikiJireiAIAction } from "./TokuteiSyotorihikiJireiAI";
import { RequestAction as ResearchAIAction } from "./ResearchAI";
import { RequestAction as PublicCommentAIAction } from "./PublicCommentAI";
import { AgentState } from "./types";

export async function AgentAction(discussion: Discussion): Promise<Comment> {
  const commentRequest = discussion.commentRequest;
  if (!commentRequest) {
    throw new Error("commentRequest is not set");
  }
  if (commentRequest.agent.id === "manager") {
    throw new Error("manager should resolve in local");
  }

  if (commentRequest.type === "agree") {
    return {
      id: commentRequest.id,
      agent: commentRequest.agent,
      type: commentRequest.type,
      message: `agree: 特になにもありません。`,
      draft: undefined,
    };
  }

  let resultState: AgentState;
  switch (commentRequest.agent.id) {
    case "basic": {
      resultState = await BaseAIAction(discussion);
      break;
    }
    case "hourei": {
      resultState = await HoureiAIAction(discussion);
      break;
    }
    case "keihin-jirei": {
      resultState = await KeihinJireiAIAction(discussion);
      break;
    }
    case "kinousei-hyouji-shokuhin": {
      resultState = await KinouseiHyoujiSyokuhinAIAction(discussion);
      break;
    }
    case "tokutei-shouhi-hou-ihan-jirei": {
      resultState = await TokuteiSyotorihikiJireiAIAction(discussion);
      break;
    }
    case "web-research": {
      resultState = await ResearchAIAction(discussion);
      break;
    }
    case "public-comment": {
      resultState = await PublicCommentAIAction(discussion);
      break;
    }
    default: {
      resultState = {
        type: "commenting",
        answer: `特になにもありません。`,
        memory: {},
      };
      break;
    }
  }

  return {
    id: commentRequest.id,
    agent: commentRequest.agent,
    type: commentRequest.type ?? "discuss",
    message: resultState.answer ?? "(no answer)",
    draft: undefined,
  };
}