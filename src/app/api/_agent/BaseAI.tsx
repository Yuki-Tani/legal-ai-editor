"use server";

import OpenAI from "openai";
import { AgentRequest, AgentState, AgentRequestType, initalAgentState } from "./types";
import { Discussion } from "@/types/Discussion";
import { mapCommentTypeToRequestType } from "./AICommon";
import { ResponseFormatJSONSchema } from "openai/src/resources/index.js";
import { requirement_list_schema } from "./BaseAISchema";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const fallbackMessages: Record<AgentRequestType, string> = {
  requestDraft: "ちょっとわかんないですね。",
  requestOpinion: "えっと、無理ですね。",
  requestComment: "あー、わかんないですね。",
  requestSuggestion: "えっと、無理ですね。",
  requestIdeaRequirement: "うーん、わかんないですね",
};

async function getChatJson(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  fallback: string,
  schema: ResponseFormatJSONSchema.JSONSchema
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_schema", json_schema: schema },
      messages,
    });
    console.log("getChatJson completion:", completion.choices[0]?.message);
    return completion.choices[0]?.message?.content ?? fallback;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return fallback;
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

async function doRequestDraft(
  coreIdea: string,
  prevState: AgentState
): Promise<AgentState> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `
# 命令
ユーザーからのアイデアと要件をもとに、法律に関わる文書のドラフトを作成してください。
# 出力
  * 作成したドラフト文章のみを出力してください。
  * それ以外のユーザーに対する話しかけ等は不要です。 
`,
    },
    {
      role: "user",
      content: `アイデアと要件:\n${coreIdea}`,
    },
  ];
  const draft = await getChatCompletion(messages, fallbackMessages.requestDraft);
  return {
    type: "draft",
    answer: draft,
    memory: prevState.memory,
  };
}

async function doRequestOpinion(
  coreIdea: string,
  draft: string,
  prevState: AgentState
): Promise<AgentState> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "ユーザーからの法律文書のドラフトに関する意見を求められました。アイデアと要件と見比べて全体の感想と修正すべき場所を200文字以内で教えてください。",
    },
    {
      role: "user",
      content: `アイデアと要件:\n${coreIdea}\n\n法律文書のドラフト全体：${draft}`,
    },
  ];
  const opinion = await getChatCompletion(messages, fallbackMessages.requestOpinion);
  return {
    type: "answering",
    answer: opinion,
    memory: prevState.memory,
  };
}

async function doRequestComment(
  coreIdea: string,
  draft: string,
  selectedText: string,
  comments: Array<{ author: string; content: string }>,
  prevState: AgentState
): Promise<AgentState> {
  let systemMessage = `以下のアイデアと要件、法律文書のドラフト全体と選択されたドラフトの一部に関して、ユーザとのやりとりが与えられます。ユーザとのやりとりの流れに従って200文字以内で新しいコメントを考えてください。回答は新しいコメントだけを返すようにしてください。他の文字列を含まないでください。\n\nアイデアと要件:\n${coreIdea}\n\n法律文書のドラフト全体：${draft}\n\n選択されたドラフトの一部の文章；${selectedText}`;
  if (selectedText == "" && draft == "") {
    systemMessage = `以下のアイデアと要件、ユーザとのやりとりが与えられます。ユーザとのやりとりの流れに従って200文字以内で新しいコメントを考えてください。回答は新しいコメントだけを返すようにしてください。他の文字列を含まないでください。\n\nアイデアと要件:\n${coreIdea}`;
  }

  const msg: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemMessage },
  ];
  comments.forEach((c) => {
    msg.push({
      role: c.author === "user" ? "user" : "assistant",
      content: c.content,
    });
  });

  const commentAnswer = await getChatCompletion(msg, fallbackMessages.requestComment);
  return {
    type: "commenting",
    answer: commentAnswer,
    memory: prevState.memory,
  };
}

async function doRequestSuggestion(
  coreIdea: string,
  draft: string,
  selectedText: string,
  prevState: AgentState
): Promise<AgentState> {
  let systemMessage =  `以下のアイデアと要件、法律文書のドラフト全体と選択されたドラフトの一部に関して、ユーザとのやりとりが与えられます。ユーザとのやりとりに従って、選択されたドラフトの一部の文章を入れ替える提案を考えてください。選択されたドラフトが空の場合には、ユーザとのやりとりに従って法律文書のドラフト全体から改善提案を作成し、どの部分を変更したら良いか明確に指摘してくださいあ。回答は提案だけを返すようにしてください。他の文字列を含まないでください。\n\nアイデアと要件:\n${coreIdea}\n\n法律文書のドラフト全体：${draft}\n\n選択されたドラフトの一部の文章；${selectedText}`;
  if (selectedText == "" && draft == "") {
    systemMessage = `以下のアイデアと要件、法律文書のドラフト全体と選択されたドラフトの一部に関して、ユーザとのやりとりが与えられます。ユーザとのやりとりに従って、選択されたドラフトの一部の文章を入れ替える提案を考えてください。選択されたドラフトが空の場合には、ユーザとのやりとりに従って法律文書のドラフト全体から改善提案を作成し、どの部分を変更したら良いか明確に指摘してくださいあ。回答は提案だけを返すようにしてください。他の文字列を含まないでください。\n\nアイデアと要件:\n${coreIdea}`;
  }

  const msg: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemMessage },
  ];
  const suggestion = await getChatCompletion(msg, fallbackMessages.requestSuggestion);
  return {
    type: "suggesting",
    answer: suggestion,
    memory: prevState.memory,
  };
}

async function doRequestIdeaRequirement(
  label: string,
  userRequirement: string,
  prevState: AgentState
): Promise<AgentState> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
      "ユーザから要求された文章のドラフトを作成するために最低限必要な情報のリストを優先度が高い順に最大2個までリストアップしてください。リストアップする内容はできるだけ一般的な内容にしてください。回答しなくてもドラフトが書ける場合はリストアップしないでください。リストアップした項目はそれぞれユーザへの質問文の形に変換してください。",
    },
    {
      role: "user",
      content: `${label}:\n${userRequirement}`,
    },
  ];

  const answerMsg = await getChatJson(
    messages,
    fallbackMessages.requestIdeaRequirement,
    requirement_list_schema
  );

  return {
    type: "answering",
    answer: answerMsg,
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

    switch (request.type) {
      case "requestDraft":
        return await doRequestDraft(request.coreIdea, prevState);

      case "requestOpinion":
        return await doRequestOpinion(request.coreIdea, request.draft, prevState);

      case "requestComment": {
        const { selection, coreIdea, draft } = request;
        return await doRequestComment(
          coreIdea,
          draft,
          selection.text,
          selection.comments ?? [],
          prevState
        );
      }

      case "requestSuggestion": {
        const { selection, coreIdea, draft } = request;
        return await doRequestSuggestion(coreIdea, draft, selection.text, prevState);
      }

      case "requestIdeaRequirement":
        return await doRequestIdeaRequirement(request.label, request.userRequirement, prevState);

      default:
        return prevState;
    }
  }

  const discussion = arg1 as Discussion;
  const commentReq = discussion.commentRequest;
  if (!commentReq || !commentReq.type) {
    return {
      type: "silent",
      answer: "BaseAI: discussion has no commentRequest",
      memory: {},
    };
  }

  const mappedType = mapCommentTypeToRequestType(commentReq.type);
  const selectedText = discussion.selectedText || "";
  const draftString = JSON.stringify(discussion.baseDraft);
  const prevState: AgentState = { ...initalAgentState };
  const coreIdea = discussion.requirements || "";
  // discussion.commentsからcomments: Array<{ author: string; content: string }>を取得する・
  // authorはdiscussion.comment.agent.idがmanagerの場合は"user"、それ以外は"assistant"とする
  const comments = discussion.comments.map((c) => ({ author: c.agent.id === "manager" ? "user" : "assistant", content: c.message }));

  switch (mappedType) {
    case "requestDraft":
      return await doRequestDraft(coreIdea, prevState);

    case "requestOpinion":
      return await doRequestOpinion(coreIdea, draftString, prevState);

    case "requestComment":
      return await doRequestComment(coreIdea, draftString, selectedText, comments, prevState);

    case "requestSuggestion":
      return await doRequestSuggestion(coreIdea, draftString, selectedText, prevState);

    case "requestIdeaRequirement":
      return await doRequestIdeaRequirement("", "", prevState);

    default:
      return {
        type: "silent",
        answer: "BaseAI fallback (Discussion)",
        memory: {},
      };
  }
}
