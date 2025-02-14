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
      const leagalTermsExtractSystemMessage = `以下の文章から法律の専門用語を抜き出してください。それぞれの法律用語は,で区切ってください。
文章：この文書は、サービスの利用条件、機密保持、責任制限などを含む基本的な利用規約を示しています。
回答：利用条件,機密保持,責任制限,利用規約
文章：**6. 機密保持** ユーザーと当社は、本サービスを通じて得られた情報、データ、文書に関して守秘義務を負います。
回答：機密保持,守秘義務
文章：${text}
回答：`;
      const legalTermsExtractMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "user", content: leagalTermsExtractSystemMessage },
      ];
      let legalTerms = await getChatCompletion(
        legalTermsExtractMessages,
        fallbackMessages.requestComment
      );
      console.log("legalTerms", legalTerms);

      // 次に、法律用語を切り出す
      const legalTermsArray = legalTerms.split(",");

      // legalTermsArrayの単語それぞれでhandleSearchを非同期で呼び出して、用語とその法令を文字列として保存(最大５回)
      const searchResults = await Promise.all(
        legalTermsArray.slice(0, 5).map(async (term) => {
          const result = await handleSearch(term);
          return result;
        })
      );
      console.log("searchResults", searchResults);

      // searchResultsを使ってコメントを生成
      const systemMessage = `以下のアイデアと要件、法律文書のドラフト全体と選択されたドラフトの一部に関して、ユーザとのやりとりが与えられます。以下の法令情報を具体的に引用して200文字以内で新しいコメントを考えてください。回答は新しいコメントだけを返すようにしてください。他の文字列を含まないでください。\n\nアイデアと要件:\n${coreIdea}\n\n法律文書のドラフト全体：${draft}\n\n選択されたドラフトの一部の文章；${selectedText}\n\n法令情報：${searchResults.join("\n")}`;

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
