"use server";

import { ResponseFormatJSONSchema } from "openai/src/resources/index.js";
import { AgentRequest, AgentState, AgentRequestType } from "./types";
import OpenAI from "openai";

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

const requirement_list_schema = {
  name: "requirement_list",
  strict: true,
  schema: {
    type: "object",
    properties: {
      requirements: {
        type: `array`,
        items: {
          type: "string",
        },
      },
    },
    required: ["requirements"],
    additionalProperties: false,
  },
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
    console.log(completion.choices[0].message);
    return completion.choices[0]?.message?.content ?? fallback;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return fallback;
  }
}

export async function RequestAction(
  prevState: AgentState,
  request: AgentRequest
): Promise<AgentState> {
  switch (request.type) {
    case "requestDraft": {
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
          content: `アイデアと要件:\n${request.coreIdea}`,
        },
      ];
      const draft = await getChatCompletion(
        messages,
        fallbackMessages.requestDraft
      );
      return {
        type: "draft",
        answer: draft,
        memory: prevState.memory,
      };
    }

    case "requestOpinion": {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content:
            "ユーザーからの法律文書のドラフトに関する意見を求められました。アイデアと要件と見比べて全体の感想と修正すべき場所を200文字以内で教えてください。",
        },
        {
          role: "user",
          content: `アイデアと要件:\n${request.coreIdea}\n\n法律文書のドラフト全体：${request.draft}`,
        },
      ];
      const opinion = await getChatCompletion(
        messages,
        fallbackMessages.requestOpinion
      );
      return {
        type: "answering",
        answer: opinion,
        memory: prevState.memory,
      };
    }

    case "requestComment": {
      const { selection, coreIdea, draft } = request;
      const { text: selectedText, comments } = selection;
      const systemMessage = `以下のアイデアと要件、法律文書のドラフト全体と選択されたドラフトの一部に関して、ユーザとのやりとりが与えられます。ユーザとのやりとりの流れに従って200文字以内で新しいコメントを考えてください。回答は新しいコメントだけを返すようにしてください。他の文字列を含まないでください。\n\nアイデアと要件:\n${coreIdea}\n\n法律文書のドラフト全体：${draft}\n\n選択されたドラフトの一部の文章；${selectedText}`;

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

    case "requestSuggestion": {
      const { selection, coreIdea, draft } = request;
      const { text: selectedText } = selection;
      const systemMessage = `以下のアイデアと要件、法律文書のドラフト全体と選択されたドラフトの一部に関して、ユーザとのやりとりが与えられます。ユーザとのやりとりに従って、選択されたドラフトの一部の文章を入れ替える提案を考えてください。選択されたドラフトが空の場合には、ユーザとのやりとりに従って法律文書のドラフト全体から改善提案を作成し、どの部分を変更したら良いか明確に指摘してくださいあ。回答は提案だけを返すようにしてください。他の文字列を含まないでください。\n\nアイデアと要件:\n${coreIdea}\n\n法律文書のドラフト全体：${draft}\n\n選択されたドラフトの一部の文章；${selectedText}`;

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemMessage },
      ];
      const suggestion = await getChatCompletion(
        messages,
        fallbackMessages.requestSuggestion
      );
      return {
        type: "suggesting",
        answer: suggestion,
        memory: prevState.memory,
      };
    }

    case "requestIdeaRequirement": {
      console.log(request);
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content:
            "ユーザから要求された文章のドラフトを作成するために最低限必要な情報のリストを優先度が高い順に最大2個までリストアップしてください。リストアップする内容はできるだけ一般的な内容にしてください。回答しなくてもドラフトが書ける場合はリストアップしないでください。リストアップした項目はそれぞれユーザへの質問文の形に変換してください。",
        },
        {
          role: "user",
          content: `${request.label}:\n${request.userRequirement}`,
        },
      ];

      console.log(messages);
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

    default: {
      return prevState;
    }
  }
}
