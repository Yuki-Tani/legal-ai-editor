"use server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

export default async function DraftStructuringAction(
  request: string
): Promise<string> {
  try {
    let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    const systemMessage = `
# 命令
あなたはユーザーの提供する情報から、文章全体の構成を考えるAIである。
以下の情報とコメントをもとに、文書に必要となる見出しを、読書が理解しやすい順番かつ階層を整理したうえで出力せよ。
`;
    messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: request },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
    });
    const plainDraftResponse = completion.choices[0]?.message;
    console.log(completion.choices[0].message);

    return plainDraftResponse?.content ?? "";
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "";
  }
}
