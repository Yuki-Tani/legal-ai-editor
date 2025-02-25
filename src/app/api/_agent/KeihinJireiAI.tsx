"use server";

import { AgentRequest, AgentState, AgentRequestType, initalAgentState } from "./types";
import { Discussion } from "@/types/Discussion";
import OpenAI from "openai";
import { mapCommentTypeToRequestType } from "./AICommon";
import { last } from "slate";

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
    const response = await fetch("http://127.0.0.1:5000/api/get_keihin_jirei_context", {
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

async function doRequestCommentKeihin(
  prevState: AgentState,
  selectedText: string,
  draft: string,
  coreIdea: string,
  comments: Array<{ author: string; content: string }>
): Promise<AgentState> {
  let searchText = selectedText || draft || coreIdea;
  const searchResults = await callFlaskGetContext(searchText);
  let systemMessage = `法律文章についてのアイデアと要件、それによって生成された文章、関連する景品表示法処分事例、ユーザとのやりとりが与えられます。以下の景品表示法処分事例からユーザーの文章と関連するものを１つ引用して500文字以内で文章についての修正提案コメントを考えてください。回答には「事例の処分日時、サービス、処分内容、表示と実際、違反分類、罰則」などの処分事例を詳細に要約した散文文章を含むコメントのみを返信してください。
  アイデアと要件；${coreIdea}\n\nユーザーの文章；${selectedText}\n\n景品表示法処分事例：${searchResults}`;
  if (searchText == coreIdea) {
    systemMessage = `法律文章についてのアイデアと要件、関連する景品表示法処分事例、ユーザとのやりとりが与えられます。以下の景品表示法処分事例からユーザーの文章と関連するものを１つ引用して500文字以内で文章についての修正提案コメントを考えてください。回答には「事例の処分日時、サービス、処分内容、表示と実際、違反分類、罰則」などの処分事例を詳細に要約した散文文章を含むコメントのみを返信してください。
  アイデアと要件；${coreIdea}\n\n景品表示法処分事例：${searchResults}`;
  }

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemMessage },
  ];
  comments.forEach((c) => {
    messages.push({
      role: c.author === "user" ? "user" : "assistant",
      content: c.content,
    });
  });

  const commentAnswer = await getChatCompletion(messages, fallbackMessages.requestComment);
  return {
    type: "commenting",
    answer: commentAnswer,
    memory: prevState.memory,
  };
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
    const request = arg2;
    if (request.type === "requestComment") {
      const { text: selectedText, comments } = request.selection;
      const draft = request.draft;
      const coreIdea = request.coreIdea;
      return await doRequestCommentKeihin(prevState, selectedText, draft, coreIdea, comments || []);
    }
    return arg1 as AgentState;
  }

  const discussion = arg1 as Discussion;
  const ctype = discussion.commentRequest?.type;
  if (!ctype) {
    return { type: "silent", answer: "KeihinJireAI: no commentRequest", memory: {} };
  }

  const mapped = mapCommentTypeToRequestType(ctype);
  const selectedText = discussion.selectedText || "";
  const draftStr = JSON.stringify(discussion.baseDraft);
  const prevState: AgentState = { ...initalAgentState };

  if (mapped === "requestComment") {
    const coreIdea = discussion.requirements || "";
    const comments = discussion.comments.map((c) => ({ author: c.agent.id === "manager" ? "user" : "assistant", content: c.message }));
    return await doRequestCommentKeihin(prevState, selectedText, draftStr, coreIdea, comments);
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
    answer: "KeihinJireAI fallback(Discussion)",
    memory: {},
  };
}
