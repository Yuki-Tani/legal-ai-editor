"use server";

import { AgentRequest, AgentState, AgentRequestType } from "./types";
import { SearchAndGetTextAction } from "../_egov/HoureiApi";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const fallbackMessages: Record<AgentRequestType, string> = {
  requestDraft: "ちょっとわかんないですね。",
  requestOpinion: "えっと、無理ですね。",
  requestComment: "あー、法律わかんないです。",
  requestSuggestion: "えっと、無理ですね。",
  requestIdeaRequirement: "うーん、わかんないですね",
};

async function callFlaskGetContext(question: string): Promise<string> {
  try {
    const response = await fetch("http://127.0.0.1:5000/api/get_context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
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

async function getChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  fallback: string
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });
    return completion.choices[0]?.message?.content ?? fallback;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return fallback;
  }
}

async function handleSearch(query: string) {
  const result = await SearchAndGetTextAction(query);
  return result;
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
      const searchResults = await callFlaskGetContext(text);
      console.log(searchResults);
      const systemMessage = `法律文章についてのアイデアと要件、ユーザーの文章、関連する法令、ユーザとのやりとりが与えられます。以下の法令から条文を1つ引用して500文字以内で修正提案コメントを考えてください。回答はコメントと関連する法令の条文のみを返信してください。\n\nアイデアと要件:\n${coreIdea}\n\nユーザーの文章；${selectedText}\n\n法令の条文：${searchResults}`;

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemMessage },
      ];
      comments.forEach((comment) => {
        messages.push({
          role: comment.author === "user" ? "user" : "assistant",
          content: comment.content,
        });
      });

      const commentAnswer = await getChatCompletion(
        messages,
        fallbackMessages.requestComment
      );
      return {
        type: "commenting",
        answer: commentAnswer,
        memory: prevState.memory,
      };
    }

    default: {
      return prevState;
    }
  }
}
