'use server';
import { Draft } from "@/types/Draft";
import { OpenAIDraftResponseFormat } from "@/types/DraftResponseFormat";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

export default async function CommonDraftWriterAction(prevDraft: Draft, request: string): Promise<Draft> {
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `
# 命令
あなたはユーザーの提供する情報に基づいて、法律に関係する文書を作成するエージェントである。
以下の情報をもとに、法律に関係する文書のドラフトを作成せよ。
# 出力フォーマット
ドラフトは、段落 paragraph と見出し heading を有効活用し、成形された形で出力せよ。
`
          + (prevDraft.length !== 0) ? `
# 既存のドラフト
ユーザーが事前に用意したドラフトは以下の通りである。参考にせよ。
${JSON.stringify(prevDraft)}
` : ""
        },
        { role: "user", content: request },
      ],
      response_format: OpenAIDraftResponseFormat,
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
