"use server";

import { AgentRequest, AgentState, AgentRequestType } from "./types";
import { Discussion } from "../../_types/Discussion";

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
    console.log(responseText);
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error("JSON パースに失敗しました: " + parseError);
    }

    if (!response.ok) {
      throw new Error(data.error || "Flask API エラー");
    }

    return data.result;
  } catch (error) {
    console.error("Flask API 呼び出しエラー:", error);
    return "";
  }
}

export async function RequestAction(
  prevState: AgentState,
  request: AgentRequest
): Promise<AgentState>;
export async function RequestAction(discussion: Discussion): Promise<AgentState>;

export async function RequestAction(
  arg1: AgentState | Discussion,
  arg2?: AgentRequest
): Promise<AgentState> {
  if (arg2 !== undefined) {
    const prevState = arg1 as AgentState;
    const request = arg2 as AgentRequest;
    switch (request.type) {
      case "requestComment": {
        const { selection, coreIdea, draft } = request;
        const { text: selectedText } = selection;
        const text = selectedText === "" ? draft : selectedText;
        const searchResult = await callFlaskGeminiSearch(text);
        console.log(searchResult);

        return {
          type: "commenting",
          answer: searchResult,
          memory: prevState.memory,
        };
      }
      default: {
        return {
          ...prevState,
          answer: fallbackMessages[request.type] ?? "不明なリクエストです。",
        };
      }
    }
  }

  const discussion = arg1 as Discussion;

  if (discussion.commentRequest?.type === "discuss") {
    const text = discussion.selectedRange
      ? "選択範囲のテキスト"
      : JSON.stringify(discussion.baseDraft);

    const searchResult = await callFlaskGeminiSearch(text);

    return {
      type: "commenting",
      answer: searchResult,
      memory: {},
    };
  }

  return {
    type: "commenting",
    answer: "特に何も検索しませんでした。",
    memory: {},
  };
}