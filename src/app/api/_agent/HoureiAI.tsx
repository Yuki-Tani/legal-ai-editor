"use server";

import OpenAI from "openai";
import { AgentRequest, AgentState, AgentRequestType, initalAgentState } from "./types";
import { Discussion } from "@/types/Discussion";
import { mapCommentTypeToRequestType } from "./AICommon";

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
    const response = await fetch("http://127.0.0.1:5000/api/get_horei_context", {
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
      model: "gpt-4o",
      messages,
    });
    return completion.choices[0]?.message?.content ?? fallback;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return fallback;
  }
}

async function doRequestCommentHorei(
  prevState: AgentState,
  selectedText: string,
  draft: string,
  coreIdea: string,
  comments: Array<{ author: string; content: string }>
): Promise<AgentState> {
  let searchText;
  if (selectedText != "") {
    searchText = selectedText;
  } else if (draft != "" && draft != "[]" && draft != "{}") {
    searchText = draft;
  } else {
    searchText = coreIdea;
  }
  console.log("searchText");
  console.log(searchText);
  const searchResults = await callFlaskGetContext(searchText);
  let systemMessage = `法律文章についてのアイデアと要件、ユーザーの文章、関連する法令、ユーザとのやりとりが与えられます。以下の法令から条文を1つ引用して500文字以内で修正提案コメントを考えてください。回答はコメントと関連する法令の条文のみを返信してください。
  アイデアと要件；${coreIdea}\n\nユーザーの文章；${searchText}\n\n法令の条文：${searchResults}`;
  if (searchText == coreIdea) {
    systemMessage = `法律文章についてのアイデアと要件、関連するかもしれない法令、ユーザとのやりとりが与えられます。以下の特に法令から関連する条文をいくつかそのまま引用して、500文字以内でアイデアと要件に合う法律文章作成のためのコメントを考えてください。回答はコメントと関連する法令の条文のみを返信してください。
アイデアと要件；${coreIdea}\n\n法令の条文：${searchResults}`;
  }

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemMessage },
  ];
  comments.forEach((comment) => {
    messages.push({
      role: comment.author === "user" ? "user" : "assistant",
      content: comment.content,
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
export async function RequestAction(
  discussion: Discussion
): Promise<AgentState>;
export async function RequestAction(
  arg1: AgentState | Discussion,
  arg2?: AgentRequest
): Promise<AgentState> {
  if (arg2 !== undefined) {
    const prevState = arg1 as AgentState;
    const request = arg2 as AgentRequest;

    if (request.type === "requestComment") {
      const { selection, coreIdea, draft } = request;
      const { text: selectedText, comments } = selection;
      return await doRequestCommentHorei(prevState, selectedText, draft, coreIdea, comments);
    }

    return arg1 as AgentState;
  }

  const discussion = arg1 as Discussion;
  const ctype = discussion.commentRequest?.type;
  if (!ctype) {
    return {
      type: "silent",
      answer: "HoreiAI: no commentRequest",
      memory: {},
    };
  }

  const mapped = mapCommentTypeToRequestType(ctype);
  const selectedText = discussion.selectedText || "";
  const draftStr = JSON.stringify(discussion.baseDraft);

  const prevState: AgentState = { ...initalAgentState };

  if (mapped === "requestComment") {
    const coreIdea = discussion.requirements || "";
    console.log("coreIdea");
    console.log(coreIdea);
    const comments = discussion.comments.map((c) => ({ author: c.agent.id === "manager" ? "user" : "assistant", content: c.message }));
    return await doRequestCommentHorei(prevState, selectedText, draftStr, coreIdea, comments);
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
    answer: "HoreiAI fallback",
    memory: {},
  };
}
