'use server'

import { AgentRequest, AgentState } from "./types";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"]
});


export async function RequestAction(prevState: AgentState, request: AgentRequest): Promise<AgentState> {

  if (request.type === "requestDraft") {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "ユーザーからのアイデアと要件に従って法律文書のドラフトを作成してください。" },
        { role: "user", content: `アイデアと要件:\n${request.coreIdea}` },
      ],
    });
    let draft: string = completion.choices[0].message.content || "ちょっとわかんないですね。";
    return {
      type: "draft",
      answer: draft,
      memory: prevState.memory
    };
  }

  return prevState;
}