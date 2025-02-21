
'use server';

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const IdeaInterviewerResponseScheme = z.object({
  requirements: z.array(z.string()),
}).required();

const IdeaInterviewerResponseFormat = zodResponseFormat(IdeaInterviewerResponseScheme, "requirement_list");

export type IdeaInterviewerRequest = {
  label: string;
  userRequirement: string;
}
export type IdeaInterviewerResponse = {
  requirements: string[];
}

export default async function IdeaInterviewerAction(request: IdeaInterviewerRequest): Promise<IdeaInterviewerResponse> {
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
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      response_format: IdeaInterviewerResponseFormat,
      messages,
    });
    console.log(completion.choices[0].message);
    return completion.choices[0].message.parsed ?? { requirements: [] };

  } catch (error) {
    console.error("OpenAI API Error:", error);
    return { requirements: [] };
  }
}
