"use server";
import { Draft } from "@/types/Draft";
import OpenAI from "openai";
import { Discussion } from "@/types/Discussion";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod.mjs";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const UpdateScheme = z.object({from: z.string(), to: z.string()});
const UpdateResponseScheme = z.object({updates: z.array(UpdateScheme)});
const UpdateResponseSchemeFormat = zodResponseFormat(UpdateResponseScheme, "update_response");

type UpdateResponse = {
  updates: {from: string, to: string}[];
}

export default async function CommonDraftUpdaterAction(
  prevDraft: Draft,
  discussion: Discussion
): Promise<UpdateResponse> {
  try {
    let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    const systemMessage = `
# 命令
あなたはユーザーの提供する情報に基づいて、法律に関係する文書を推敲するアシスタントである。ディスカッションの内容を元に、法律に関係する文書のドラフトの推敲を行い、更新を提案せよ。
## 現在の文書のドラフト
現在ディスカッションに参加しているメンバーは、以下のドラフト（特に selected で選択された部分）に注目をしている。
${JSON.stringify(prevDraft)}
## ディスカッション
${discussion?.comments.map((c) => `${c.agent.name} : ${c.message}`).join("\n")}
## 出力
from: 現在のドラフト内に含まれる、変更するべき部分の文字列
to: 変更後のドラフト内に含まれる、変更後の部分の文字列
`;
    messages = [
      { role: "system", content: systemMessage },
    ];

    discussion?.comments.forEach((c) => {
      messages.push({ role: "user", content: c.message });
    });
    console.log(messages);

    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o",
      messages: messages,
      response_format: UpdateResponseSchemeFormat,
    });
    const plainDraftResponse = completion.choices[0]?.message;
    console.log(completion.choices[0].message);

    if (plainDraftResponse.refusal) {
      console.error("OpenAI API Error:", plainDraftResponse.refusal);
      return { updates: [] };
    }

    return plainDraftResponse.parsed ?? { updates: [] };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return { updates: [] };
  }
}
