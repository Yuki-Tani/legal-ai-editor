"use server";

import OpenAI from "openai";
import { AgentRequest, AgentState } from "./types";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const fallbackMessages = {
  requestOpinion: "申し訳ありません。意見を生成できませんでした。",
};

async function getRoleList(draft: string): Promise<Array<{ role: string; description: string }>> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `
あなたは与えられた法律文書のドラフトを分析し、この文書に関心を持つ可能性のある利害関係者（ステークホルダー）の役割を特定します。
厳密に以下のJSON形式で出力してください。マークダウンやバッククォートは使用しないでください：

{
  "roles": [
    {
      "role": "役割名",
      "description": "この役割が持つ関心事の簡潔な説明"
    }
  ]
}

最大5つの重要な役割を特定してください。
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
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `あなたは${role}の立場から意見を述べます。
関心事：${description}

以下の点に注目して、150文字程度で意見を述べてください：
- この立場特有の懸念事項
- 改善が必要な箇所
- 特に評価できる点`,
        },
        {
          role: "user",
          content: `アイデアと要件:\n${coreIdea}\n\n法律文書のドラフト：\n${draft}`,
        },
      ],
    });

    return completion.choices[0]?.message?.content ?? `${role}からの意見を生成できませんでした。`;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return `${role}からの意見を生成できませんでした。`;
  }
}

export async function RequestAction(
  prevState: AgentState,
  request: AgentRequest
): Promise<AgentState> {
  switch (request.type) {
    case "requestOpinion":
    case "requestComment": {
      // 1. Get list of relevant roles
      const roles = await getRoleList(request.draft);
      if (roles.length === 0) {
        return {
          type: "commenting",
          answer: fallbackMessages.requestOpinion,
          memory: prevState.memory,
        };
      }

      // 2. Get opinion from each role
      const opinions = await Promise.all(
        roles.map(async ({ role, description }) => {
          const opinion = await getRoleOpinion(
            role,
            description,
            request.draft,
            request.coreIdea
          );
          return {
            role,
            opinion,
          };
        })
      );
      
      // 3. Return array of comments
      return {
        type: "multipleComments",
        answers: opinions.map(({ role, opinion }) => ({
          author: role,
          content: opinion,
        })),
        memory: prevState.memory,
      };
    }

    default: {
      return prevState;
    }
  }
}
