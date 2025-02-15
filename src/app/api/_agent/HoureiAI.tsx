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
};

async function callFlaskGetContext(question: string): Promise<string> {
  try {
    const response = await fetch("http://localhost:5000/api/get_context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await response.json();
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
      // まずはgetChatCompletionを読んで選択された文章から法律用語を抜き出す
      const text = selectedText === "" ? draft : selectedText;
      const searchResults = await callFlaskGetContext(text);

      // searchResultsを使ってコメントを生成
      const systemMessage = `アイデアと要件、法律文書のドラフト全体と選択されたドラフトの一部に関して、ユーザとのやりとりが与えられます。以下の法令情報の中で関連しているものを引用して500文字以内で新しいコメントを考えてください。回答は新しいコメントだけを返すようにしてください。\n\nアイデアと要件:\n${coreIdea}\n\n法律文書のドラフト全体：${draft}\n\n選択されたドラフトの一部の文章；${selectedText}\n\n法令情報：${searchResults}`;

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
