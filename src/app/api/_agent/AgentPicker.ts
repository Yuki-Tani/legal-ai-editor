
'use server';

import { Agent, AgentPool } from "@/types/Agent";
import { CommentType, Discussion } from "@/types/Discussion";
import { Draft } from "@/types/Draft";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const AgentPickerScheme = z.object({
  agentIds: z.array(z.string()),
}).required();

const AgentPickerResponseFormat = zodResponseFormat(AgentPickerScheme, "picked_agent_list");

export type AgentPickerRequest = {
  request: string;
  draft: Draft;
  candidate?: Agent[];
}
export type AgentPickerResponse = {
  agents: Agent[];
}

export async function AgentPickerAction(request: AgentPickerRequest): Promise<AgentPickerResponse> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `
# ユーザーが作成中の文書のドラフト
${JSON.stringify(request.draft)}
# Agent Pool
${request.candidate ? JSON.stringify(request.candidate) : JSON.stringify(AgentPool)}
# 命令
ユーザーは文書作成タスクを実行中である。
ユーザーからの要求に基づいて、ユーザーが求めていると考えられるエージェントを "Agent Pool" から選択してください。
複数のエージェントを返却する場合は、ユーザーの要求との合致度が高い順に返却してください。
`
    },
    {
      role: "user",
      content: `${request.request}`,
    },
  ];
  console.log(messages);
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o",
      response_format: AgentPickerResponseFormat,
      messages,
    });
    console.log(completion.choices[0].message);
    if (!completion.choices[0].message.parsed) {
      return { agents: [] };
    }
    const agents = completion.choices[0].message.parsed?.agentIds
      .map((id: string) => AgentPool.find(agent => agent.id === id) ?? { id: "", name: "", description: "" })
      .filter((agent: Agent) => agent.id !== "");

    return { agents };

  } catch (error) {
    console.error("OpenAI API Error:", error);
    return { agents: [] };
  }
}



const NextCommentorPickerScheme = z.object({
  agentId: z.string(),
  expectedCommentType: z.union([z.literal("discuss"), z.literal("suggest"), z.literal("agree")]),
}).required();

const NextCommentorPickerResponseFormat = zodResponseFormat(NextCommentorPickerScheme, "next_expected_commentator");

export type NextCommentorPickerRequest = {
  discussion: Discussion;
  candidate?: Agent[];
}
export type NextCommentorPickerResponse = {
  agent: Agent;
  expectedCommentType: CommentType;
}

export async function NextCommentorPickerAction(request: NextCommentorPickerRequest): Promise<NextCommentorPickerResponse> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `
# 現在のディスカッション
${JSON.stringify(request.discussion) /*FUTURE: 不要な draft を取り除く*/}
# Agent Pool
${request.candidate ? JSON.stringify(request.candidate) : JSON.stringify(AgentPool)}
# 命令
ある文書について、ディスカッションが行われている。
次に発話するべきエージェントを "Agent Pool" から選択してください。
また、そのエージェントが発話すべきコメントの種類を指定してください。
## コメントの種類
- discuss: 議論を進めるコメント。追加の情報提供や、他のコメントへの反応など。
- suggest: ここまでの議論をもとに、文書変更の提案を発議するコメント。
`
    },
  ];

  console.log(messages);
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o",
      response_format: NextCommentorPickerResponseFormat,
      messages,
    });
    console.log(completion.choices[0].message);
    if (!completion.choices[0].message.parsed) {
      return { agent: { id: "manager", name: "(error)", description: "エラーが発生しました" }, expectedCommentType: "discuss" };
    }

    return {
      agent: AgentPool.find(agent => agent.id === completion.choices[0].message.parsed?.agentId) ?? { id: "manager", name: "(error)", description: "エージェントが見つかりません" },
      expectedCommentType: completion.choices[0].message.parsed?.expectedCommentType ?? "discuss",
    }

  } catch (error) {
    console.error("OpenAI API Error:", error);
    return { agent: { id: "manager", name: "(error)", description: "エラーが発生しました" }, expectedCommentType: "discuss" };
  }
}
