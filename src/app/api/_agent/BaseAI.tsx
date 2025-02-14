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
        { role: "system", content: "あなたは法律文章の専門家です。ユーザーからのアイデアと要件に従って法律文書のドラフトを作成してください。" },
        { role: "user", content: `アイデアと要件:\n${request.coreIdea}` },
      ],
    });
    let draft: string = completion.choices[0].message.content || "ちょっとわかんないですね。";
    return {
      type: "draft",
      answer: draft,
      memory: prevState.memory
    };
  } else if (request.type === "requestOpinion") {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "あなたは法律文章の専門家です。ユーザーからの法律文書のドラフトに関する意見を求められました。アイデアと要件と見比べて全体の感想と修正すべき場所を教えてください。" },
        { role: "user", content: `アイデアと要件:\n${request.coreIdea}\n\n法律文書のドラフト全体：${request.draft}` },
      ],
    });
    let opinion: string = completion.choices[0].message.content || "えっと、無理ですね。";
    return {
      type: "answering",
      answer: opinion,
      memory: prevState.memory
    };
  } else if (request.type === "requestComment") {
    let selection = request.selection;
    let comments = selection.comments;
    let selectedText = selection.text;
    let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: `あなたは法律文章の専門家です。以下のアイデアと要件、法律文書のドラフト全体と選択されたドラフトの一部の文章に関して、ユーザとのやりとりが与えられます。それに従って新しいコメントを考えてください。\nアイデアと要件:\n${request.coreIdea}\n\n法律文書のドラフト全体：${request.draft}\n\n選択されたドラフトの一部の文章；${selectedText}` }
    ];
    comments.forEach(comment => {
      if (comment.author === "user") {
        messages.push({ role: "user", content: comment.content });
      } else {
        messages.push({ role: "assistant", content: comment.content });
     }
    });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
    });
    let comment: string = completion.choices[0].message.content || "あー、わかんないですね。";
    return {
      type: "commenting",
      answer: comment,
      memory: prevState.memory
    };
  } else if (request.type === "requestSuggestion") {
    let selection = request.selection;
    let selectedText = selection.text;
    let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: `あなたは法律文章の専門家です。以下のアイデアと要件、法律文書のドラフト全体と選択されたドラフトの一部の文章に関して、ユーザとのやりとりが与えられます。それに従って選択されたドラフトの一部の文章を入れ替える新しい提案を考えてください。\nアイデアと要件:\n${request.coreIdea}\n\n法律文書のドラフト全体：${request.draft}\n\n選択されたドラフトの一部の文章；${selectedText}` }
    ];
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
    });
    let suggestion: string = completion.choices[0].message.content || "えっと、無理ですね。";
    return {
      type: "suggesting",
      answer: suggestion,
      memory: prevState.memory
    };
  }

  return prevState;
}