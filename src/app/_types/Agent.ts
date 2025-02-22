import { AgentIconType } from "@/components/AgentIcon";
import { Comment } from "./Discussion";

export type Agent = {
  id: string;
  name: string;
  description: string;
};

export const AgentPool: Agent[] = [
  {
    id: "manager",
    name: "管理者",
    description: "文書作成タスクに対して最終的な決定権限をもつエージェントです。全体的な指針の決定や、重要な決断、選択肢の選択などは、このエージェントが行うべきです。"
  },
  {
    id: "basic",
    name: "一般的な知識を持つ AI",
    description: "広く浅い一般知識を持つエージェントです。法律の専門知識は持ちませんが、素早く返答を行うことができます。"
  },
  {
    id: "hourei",
    name: "法令の知識を AI",
    description: "法令の条文について熟知しており、関連する具体的な法令を検索してその内容を踏まえて返答を行うことができます。"
  },
  {
    id: "keihin-jirei",
    name: "景品表示法違反事例 AI",
    description: "景品表示法違反事例について専門的な知識をもつエージェントです。景品表示法違反事例について実際の事例を踏まえて返答を行うことができます。"
  },
  {
    id: "kinousei-hyouji-shokuhin",
    name: "機能性表示食品 AI",
    description: "機能性表示食品について専門的な知識をもつエージェントです。関連する機能性表示食品と機能性表示食品の実際の届出内容を踏まえて返答を行うことができます。"
  },
  {
    id: "tokutei-shouhi-hou-ihan-jirei",
    name: "特定商取引法違反事例 AI",
    description: "特定商取引法違反事例について専門的な知識をもつエージェントです。特定商取引法違反事例についての判例や実際の事例を踏まえて返答を行うことができます。"
  },
  {
    id: "web-research",
    name: "Web 検索 AI",
    description: "Web 検索を行うことができるエージェントです。最新のニュースなどを検索できる強みがあります。"
  },
  {
    id: "public-comment",
    name: "パブリックコメント AI",
    description: "関連する役割からのパブリックコメントを予想して返答を行うことができるエージェントです。"
  },
]

export const AgentPoolWithoutManager: Agent[] = AgentPool.filter(agent => agent.id !== "manager");

export function getAgentIconType(agentId: string): AgentIconType {
  switch (agentId) {
    default:
      return AgentIconType.Basic;
  }
}
