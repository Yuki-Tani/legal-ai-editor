"use server";

import { AgentRequest, AgentState, AgentRequestType, initalAgentState } from "./types";
import { Discussion } from "@/types/Discussion";
import OpenAI from "openai";
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
    const response = await fetch(
      "http://127.0.0.1:5000/api/get_kinousei_hyouji_syokuhin_context",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      }
    );
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

async function doRequestCommentKinousei(
  prevState: AgentState,
  selectedText: string,
  draft: string,
  coreIdea: string,
  comments: Array<{ author: string; content: string }>
): Promise<AgentState> {
  let searchText = selectedText || draft || coreIdea;
  const searchResults = await callFlaskGetContext(searchText);
  let systemMessage = `法律文章についてのアイデアと要件、それによって生成された文章、関連する機能性食品、ユーザとのやりとりが与えられます。以下の機能性食品からユーザーの文章と関連するものを１つ以上引用して500文字以内で文章についての修正提案コメントを考えてください。回答には引用した機能性食品を詳細で具体的に説明した文章を含むコメントのみを返信してください。
  アイデアと要件；${coreIdea}\n\n文章；${selectedText}\n\n機能性食品：${searchResults}`;
  if (searchText == coreIdea) {
    systemMessage = `法律文章についてのアイデアと要件、関連する機能性食品、ユーザとのやりとりが与えられます。以下の機能性食品からユーザーの文章と関連するものを１つ以上引用して500文字以内で文章についての修正提案コメントを考えてください。回答には引用した機能性食品を詳細で具体的に説明した文章を含むコメントのみを返信してください。
  アイデアと要件；${coreIdea}\n\n機能性食品：${searchResults}`;
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
      return await doRequestCommentKinousei(prevState, selectedText, draft, coreIdea, comments || []);
    }
    return arg1 as AgentState;
  }

  const discussion = arg1 as Discussion;
  const ctype = discussion.commentRequest?.type;
  if (!ctype) {
    return {
      type: "silent",
      answer: "Kinousei fallback (Discussion) no type",
      memory: {},
    };
  }

  const mapped = mapCommentTypeToRequestType(ctype);
  const selectedText = discussion.selectedText || "";
  const draftStr = JSON.stringify(discussion.baseDraft);
  const prevState: AgentState = { ...initalAgentState };

  if (mapped === "requestComment") {
    const coreIdea = discussion.requirements || "";
    const comments = discussion.comments.map((c) => ({ author: c.agent.id === "manager" ? "user" : "assistant", content: c.message }));
    return await doRequestCommentKinousei(prevState, selectedText, draftStr, coreIdea, comments);
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
    answer: "Kinousei fallback(Discussion)",
    memory: {},
  };
}
