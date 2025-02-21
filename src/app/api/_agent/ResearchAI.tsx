"use server";

import { AgentRequest, AgentState, AgentRequestType } from "./types";

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
): Promise<AgentState> {
  switch (request.type) {
    case "requestComment": {
      const { selection, coreIdea, draft } = request;
      const { text: selectedText, comments } = selection;
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
      return prevState;
    }
  }
}
