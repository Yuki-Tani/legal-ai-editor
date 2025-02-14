"use server";

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

export async function RequestAction(
  prevState: AgentState,
  request: AgentRequest
): Promise<AgentState> {
  switch (request.type) {
    case "requestDraft": {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content:
            "あなたは法律文章の専門家です。ユーザーからのアイデアと要件に従って法律文書のドラフトを作成してください。",
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
            "あなたは法律文章の専門家です。ユーザーからの法律文書のドラフトに関する意見を求められました。アイデアと要件と見比べて全体の感想と修正すべき場所を教えてください。",
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
      const systemMessage = `あなたは法律文章の専門家です。以下のアイデアと要件、法律文書のドラフト全体と選択されたドラフトの一部に関して、ユーザとのやりとりが与えられます。それに従って新しいコメントを考えてください。\n\nアイデアと要件:\n${coreIdea}\n\n法律文書のドラフト全体：${draft}\n\n選択されたドラフトの一部の文章；${selectedText}`;

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
      const systemMessage = `あなたは法律文章の専門家です。以下のアイデアと要件、法律文書のドラフト全体と選択されたドラフトの一部に関して、ユーザとのやりとりが与えられます。それに従って選択部分を入れ替える新しい提案を考えてください。\n\nアイデアと要件:\n${coreIdea}\n\n法律文書のドラフト全体：${draft}\n\n選択されたドラフトの一部の文章；${selectedText}`;

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

    default: {
      return prevState;
    }
  }
}
