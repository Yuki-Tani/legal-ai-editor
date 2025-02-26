import { AgentIconType } from "@/components/AgentIcon";

export type Agent = {
  id: string;
  name: string;
  description: string;
};

export const ManagerAgent = {
  id: "manager",
  name: "管理者",
  description:
    "文書作成タスクに対して最終的な決定権限をもつエージェントです。全体的な指針の決定や、重要な決断、選択肢の選択などは、このエージェントが行うべきです。",
}

export const AgentPool: Agent[] = [
  ManagerAgent,
  {
    id: "basic",
    name: "一般的な知識を持つ AI",
    description:
      "広く浅い一般知識を持つエージェントです。法律の専門知識は持ちませんが、素早く返答を行うことができます。大抵の場合、最初にこのエージェントに意見を仰ぐことで議論がうまく進みます。",
  },
  {
    id: "hourei",
    name: "法令 AI",
    description:
      "法令の条文について熟知しており、関連する具体的な法令を検索してその内容を踏まえて返答を行うことができます。",
  },
  {
    id: "keihin-jirei",
    name: "景品表示法違反事例 AI",
    description:
      "景品表示法違反事例について専門的な知識をもつエージェントです。景品表示法違反事例について実際の事例を踏まえて返答を行うことができます。",
  },
  {
    id: "kinousei-hyouji-shokuhin",
    name: "機能性表示食品 AI",
    description:
      "機能性表示食品について専門的な知識をもつエージェントです。関連する機能性表示食品と機能性表示食品の実際の届出内容を踏まえて返答を行うことができます。",
  },
  {
    id: "tokutei-shouhi-hou-ihan-jirei",
    name: "特定商取引法違反事例 AI",
    description:
      "特定商取引法違反事例について専門的な知識をもつエージェントです。特定商取引法違反事例についての判例や実際の事例を踏まえて返答を行うことができます。",
  },
  {
    id: "web-research",
    name: "Webリサーチ AI",
    description:
      "法律や法律以外のトピックについてWeb検索を行って専門知識を取得できるエージェントです。最新の情報を検索できる強みがあります。",
  },
  {
    id: "public-comment",
    name: "パブリックコメント AI",
    description:
      "関連する企業や個人からのパブリックコメントを予想して返答を行うことができるエージェントです。",
  },
];

export const AgentPoolWithoutManager: Agent[] = AgentPool.filter(
  (agent) => agent.id !== "manager"
);

export function getAgentIconType(agentId: string): AgentIconType {
  switch (agentId) {
    case "basic":
      return AgentIconType.Basic;
    case "manager":
      return AgentIconType.Manager;
    case "moderator":
      return AgentIconType.Basic;
    case "hourei":
      return AgentIconType.Hourei;
    case "keihin-jirei":
      return AgentIconType.KeihinJirei;
    case "kinousei-hyouji-shokuhin":
      return AgentIconType.KinouseiHyoujiShokuhin;
    case "tokutei-shouhi-hou-ihan-jirei":
      return AgentIconType.TokuteiShouhiHouIhanJirei;
    case "web-research":
      return AgentIconType.WebResearch;
    case "public-comment":
      return AgentIconType.PublicComment;
    default:
      return AgentIconType.Basic;
  }
}
