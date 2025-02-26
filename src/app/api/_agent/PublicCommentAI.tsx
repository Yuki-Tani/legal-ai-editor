"use server";

import OpenAI from "openai";
import { AgentRequest, AgentState, initalAgentState, AgentRequestType } from "./types";
import { Discussion } from "@/types/Discussion";
import { mapCommentTypeToRequestType } from "./AICommon";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const fallbackMessages: Record<AgentRequestType, string> = {
  requestDraft: "ちょっとわかんないですね。",
  requestOpinion: "申し訳ありません。意見を生成できませんでした。",
  requestComment: "あー、法律わかんないです。",
  requestSuggestion: "えっと、無理ですね。",
  requestIdeaRequirement: "うーん、わかんないですね",
};

async function getRoleList(draft: string): Promise<Array<{ role: string; description: string }>> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
あなたは与えられた法律文書のドラフトを分析し、この文書に関心を持つ可能性のある利害関係者（ステークホルダー）の役割を特定します。ステークホルダーは曖昧なものではなく、なるべく具体的で簡潔なペルソナを指定するようにしてください。例えば、「企業」ではなく「従業員数300人程度の食品生産工場の法務担当者」といったものや、「消費者」ではなく「アレルギーを持つ40代女性の消費者」といったものです。
厳密に以下のJSON形式で出力してください。マークダウンやバッククォートは使用しないでください：

{
  "roles": [
    {
      "role": "役割名",
      "description": "この役割が持つ関心事の簡潔な説明"
    }
  ]
}

最大3つの重要な役割を特定してください。
必ず有効なJSONのみを出力してください。余計なテキストは含めないでください。`,
        },
        {
          role: "user",
          content: draft,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return [];
    
    try {
      // Remove any markdown backticks or json labels if present
      const cleanContent = content.replace(/```json\s*|```\s*$/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      return parsed.roles || [];
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError);
      console.error("Raw content:", content);
      return [];
    }
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return [];
  }
}

async function getRoleOpinion(
  role: string,
  description: string,
  draft: string,
  coreIdea: string
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `これから以下のがアイデアと要件に基づいて法律の文章を作成しようとしている団体があります。あなたは${role}の立場からそれについて意見を述べます。${role}の立場に偏った視点で、中立的な立場を取らずに意見を述べてください。
関心事：${description}

以下の点に注目して、150文字程度で意見を述べてください：
- この立場の人間がアイデアと要件にどのように関連するか・影響を受けるか、具体的事例を含めて説明する
- この立場の人間が持っている専門的な知識を提示して、その知識がアイデアと要件にどのように影響するか説明する
- この立場特有の懸念事項があれば、それについても述べる
- この立場の期待する法律文書の方向性と、避けたい方向性について述べる
- 改善が必要な箇所があれば、それについても述べる
- 特に評価できる点があれば、それについても述べる`,
        },
        {
          role: "user",
          content: `アイデアと要件:\n${coreIdea}\n\n法律文書のドラフト(任意）：\n${draft}`,
        },
      ],
    });

    return completion.choices[0]?.message?.content ?? `${role}からの意見を生成できませんでした。`;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return `${role}からの意見を生成できませんでした。`;
  }
}

async function doRequestOpinionOrCommentPublic(
  prevState: AgentState,
  draft: string,
  coreIdea: string
): Promise<AgentState> {
  let text = draft;
  if (text === "" || text === "[]" || text === "{}") {
    text = coreIdea;
  }
  const roles = await getRoleList(text);
  if (!roles || roles.length === 0) {
    return {
      type: "commenting",
      answer: fallbackMessages.requestOpinion,
      memory: prevState.memory,
    };
  }
  const opinions = await Promise.all(
    roles.map(async ({ role, description }) => {
      const op = await getRoleOpinion(role, description, draft, coreIdea);
      return { author: role, content: op };
    })
  );
  console.log(opinions);
  return {
    type: "multipleComments",
    answers: opinions,
    memory: prevState.memory,
  };
}

export async function RequestAction(
  prevState: AgentState,
  request: AgentRequest
): Promise<AgentState>;
export async function RequestAction(
  discussion: Discussion
): Promise<AgentState>;

export async function RequestAction(
  arg1: AgentState | Discussion,
  arg2?: AgentRequest
): Promise<AgentState> {
  if (arg2 !== undefined) {
    const prevState = arg1 as AgentState;
    const request = arg2;
    if (request.type === "requestOpinion" || request.type === "requestComment") {
      return await doRequestOpinionOrCommentPublic(prevState, request.draft, request.coreIdea);
    }
    return arg1 as AgentState;
  }

  const discussion = arg1 as Discussion;
  const t = discussion.commentRequest?.type;
  if (!t) {
    return { type: "silent", answer: "PublicComment no commentRequest", memory: {} };
  }
  const mapped = mapCommentTypeToRequestType(t);
  const draftStr = JSON.stringify(discussion.baseDraft);
  const selectedText = discussion.selectedText || "";
  const prevState: AgentState = { ...initalAgentState };

  if (mapped === "requestOpinion" || mapped === "requestComment") {
    const coreIdea = discussion.requirements || "";;
    return await doRequestOpinionOrCommentPublic(prevState, draftStr, coreIdea);
  } else if (mapped === "requestSuggestion") {
    return {
      type: "suggesting",
      answer: "",
      memory: {},
    };
  }

  return {
    type: "silent",
    answer: "PublicComment fallback",
    memory: {},
  };
}
