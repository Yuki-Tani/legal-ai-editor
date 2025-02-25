
'use server';

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const IdeaInterviewerResponseScheme = z.object({
  requirements: z.array(z.string()),
});

type IdeaInterviewerRequest = {
  request: string;
};

type IdeaInterviewerResponse = {
  requirements: string[];
};

const IdeaInterviewerResponseFormat = zodResponseFormat(IdeaInterviewerResponseScheme, "requirement_list");

export default async function IdeaInterviewerAction(request: IdeaInterviewerRequest): Promise<IdeaInterviewerResponse> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "管理者が作成したいドラフトを作成するために最低限必要な情報のリストを優先度が高い順に最大2個までリストアップしてください。リストアップする内容はできるだけ一般的な内容にしてください。回答しなくてもドラフトが書ける場合はリストアップしないでください。リストアップした項目はそれぞれ管理者への質問文の形に変換してください。",
    },
    {
      role: "user",
      content: request.request,
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
