import { Comment, Discussion } from "@/types/Discussion";
import { RequestAction as BaseAIAction } from "./BaseAI";
import { RequestAction as ResearchAIAction } from "./ResearchAI";
import { initalAgentState } from "./types";


export async function AgentAction(discussion: Discussion) : Promise<Comment> {
  const commentRequest = discussion.commentRequest;
  if (!commentRequest) { throw new Error("commentRequest is not set"); }
  if (commentRequest.agent.id === "manager") { throw new Error("manager should resolve in local"); }

  console.log(commentRequest);

  /*
  if (commentRequest.agent.id === "basic") {
    // TODO: 定義を書き換えて、そのままリターンさせる
    // return BaseAIAction(discussion);\
    // 以下テスト用
    if (commentRequest.type === "pointout") {
      const result = await BaseAIAction(initalAgentState, {type: "requestOpinion", coreIdea: "", draft: JSON.stringify(discussion.baseDraft)});
      return {
        id: commentRequest.id,
        agent: commentRequest.agent,
        type: commentRequest.type,
        message: result.answer ?? `特になにもありません`,
        draft: discussion.baseDraft,
      };
    }
    if (commentRequest.type === "discuss") {
      return {
        id: commentRequest.id,
        agent: commentRequest.agent,
        type: commentRequest.type,
        message: `他の人の意見も聞いてみたいです`,
        draft: undefined,
      };
    }
  } else if (commentRequest.agent.id === "web-research") {
    if (commentRequest.type === "discuss") {
      const result = await ResearchAIAction(discussion);
      return {
        id: commentRequest.id,
        agent: commentRequest.agent,
        type: commentRequest.type,
        message: result.answer ?? "(web-research)何も応答がありませんでした",
        draft: discussion.baseDraft,
      };
    }

    return {
      id: commentRequest.id,
      agent: commentRequest.agent,
      type: commentRequest.type ?? "discuss",
      message: `${commentRequest.type}: 特になにもありません。(web-research fallback)`,
      draft: undefined,
    };
  }*/

  if (commentRequest.type === "discuss") {
    const result = await ResearchAIAction(discussion);
    return {
      id: commentRequest.id,
      agent: commentRequest.agent,
      type: commentRequest.type,
      message: result.answer ?? "(web-research)何も応答がありませんでした",
      draft: discussion.baseDraft,
    };
  }
  return {
    id: commentRequest.id,
    agent: commentRequest.agent,
    type: commentRequest.type ?? "discuss",
    message: `${commentRequest.type}: 特になにもありません。`,
    draft: undefined,
  };
}