"use server";
import { Draft } from "@/types/Draft";
import { OpenAIPlainDraftResponseFormat } from "@/types/DraftResponseFormat";
import OpenAI from "openai";
import { Discussion } from "@/types/Discussion";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

export default async function CommonDraftWriterAction(
  prevDraft: Draft,
  request: string,
  discussion?: Discussion
): Promise<Draft> {
  try {
    let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    const systemMessage = `
# 命令
あなたはユーザーの提供する情報に基づいて、法律に関係する文書を作成するアシスタントである。以下の情報をもとに、法律に関係する文書のドラフトを作成せよ。
作成する前に、<thinking></thinking>内で以下のことについて熟考せよ。
1. 文書に必要となる見出しを、読書が理解しやすい順番かつ階層を整理する。
2. 作成した見出しに沿って、ドラフトを作成する。
# 出力フォーマット
ドラフトは、段落 paragraph と見出し heading を使用して成形された形で出力せよ。
`;
    messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: request },
    ];

    discussion?.comments.forEach((c) => {
      messages.push({ role: "user", content: c.message });
    });
    console.log(messages);

    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o",
      messages: messages,
      response_format: OpenAIPlainDraftResponseFormat,
    });
    const plainDraftResponse = completion.choices[0]?.message;
    console.log(completion.choices[0].message);

    if (plainDraftResponse.refusal) {
      console.error("OpenAI API Error:", plainDraftResponse.refusal);
      return prevDraft;
    }

    return plainDraftResponse.parsed?.draft ?? prevDraft;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return prevDraft;
  }
}
