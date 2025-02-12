'use server'

import { AgentRequest, AgentState } from "./types";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"]
});


export async function RequestAction(prevState: AgentState, request: AgentRequest): Promise<AgentState> {

  if (request.type === "requestOpinion") {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: `Draft:\n${request.draft}\nGive your opinion.` },
      ],
    });
    let opinion: string = completion.choices[0].message.content || "I have no opinion.";
    return {
      type: "answering",
      answer: opinion,
      memory: prevState.memory
    };
  }

  return prevState;
}