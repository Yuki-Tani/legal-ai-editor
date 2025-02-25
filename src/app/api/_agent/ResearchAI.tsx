"use server";

import { AgentRequest, AgentState, AgentRequestType, initalAgentState } from "./types";
import { Discussion } from "@/types/Discussion";
import { mapCommentTypeToRequestType } from "./AICommon";

const fallbackMessages: Record<AgentRequestType, string> = {
  requestDraft: "ちょっとわかんないですね。",
  requestOpinion: "えっと、無理ですね。",
  requestComment: "あー、法律わかんないです。",
  requestSuggestion: "えっと、無理ですね。",
  requestIdeaRequirement: "うーん、わかんないですね",
};

async function callFlaskGeminiSearch(text: string): Promise<string> {
  try {
    const response = await fetch("http://127.0.0.1:5000/api/search_external_topic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const responseText = await response.text();
    if (!responseText) {
      throw new Error("Flask API から空のレスポンスが返されました");
    }
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error("JSON パースに失敗しました: " + parseError);
    }

    if (!response.ok) {
      throw new Error(data.error || "Flask API エラー");
    }

    return data.context;
  } catch (error) {
    console.error("Flask API 呼び出しエラー:", error);
    return "";
  }
}

async function doRequestCommentResearch(
  prevState: AgentState,
  coreIdea: string,
  selectedText: string,
  draft: string
): Promise<AgentState> {
  const text = selectedText || draft || coreIdea;
  const searchResult = await callFlaskGeminiSearch(text);
  return {
    type: "commenting",
    answer: searchResult,
    memory: prevState.memory,
  };
}

export async function RequestAction(
  prevState: AgentState,
  request: AgentRequest
): Promise<AgentState>;
export async function RequestAction(
  discussion: Discussion
): Promise<AgentState>;

export async function RequestAction(
  arg1: AgentState | Discussion,
  arg2?: AgentRequest
): Promise<AgentState> {
  if (arg2 !== undefined) {
    const prevState = arg1 as AgentState;
    const request = arg2;
    if (request.type === "requestComment") {
      const { text: selectedText } = request.selection;
      const coreIdea = request.coreIdea;
      return await doRequestCommentResearch(prevState, coreIdea, selectedText, request.draft);
    }
    return prevState;
  }

  const discussion = arg1 as Discussion;
  const ctype = discussion.commentRequest?.type;
  if (!ctype) {
    return {
      type: "silent",
      answer: "ResearchAI: discussion has no commentRequest",
      memory: {},
    };
  }

  const mapped = mapCommentTypeToRequestType(ctype);
  const selectedText = discussion.selectedText || "";
  const draftStr = JSON.stringify(discussion.baseDraft);
  const prevState: AgentState = { ...initalAgentState };
  const coreIdea = discussion.requirements || "";

  if (mapped === "requestComment") {
    return await doRequestCommentResearch(prevState, coreIdea, selectedText, draftStr);
  } else if (mapped === "requestOpinion") {
    return {
      type: "answering",
      answer: "",
      memory: {},
    };
  } else if (mapped === "requestSuggestion") {
    return {
      type: "suggesting",
      answer: "",
      memory: {},
    };
  }

  return {
    type: "silent",
    answer: "ResearchAI fallback(Discussion)",
    memory: {},
  };
}
