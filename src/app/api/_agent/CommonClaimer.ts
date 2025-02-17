'use server';
import { Draft } from "@/types/Draft";
import { OpenAIClaimResponseFormat } from "@/types/DraftResponseFormat";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

export type Claim ={
  selectedDraft: Draft,
  comment: string,
}

export default async function CommonClaimerAction(prevClaim: Claim, draft: Draft): Promise<Claim> {
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o",
      messages: [
        { role: "system", content: `
# 文脈
ユーザーは、法律関係の文章のドラフトを持っていて、そのドラフトに問題点があるかどうかを知りたいと考えている。
ドラフトは paragraph や heading などの要素を含み、形式化されている。
ドラフトの一部分を指し示すためには、selected をドラフト内の対象部分に付与するルールとなっていて、このルールを必ず守らなければならない。

# 命令
現在のドラフト文書がユーザー入力として与えられる。問題点を１点指摘せよ。また、問題を含む部分をユーザーに指し示したドラフト文書を返却せよ。
* <thinking></thinking> 内で命令について熟考してから返答せよ。
* selected 属性についてはコメント内で言及せず、代わりに selected 属性を付与したドラフト文書を返却せよ。

# 例
<Input>
'{"draft":[{"type":"heading","level":1,"children":[{"type":"plain_text","text":"AI に関するガイドライン"}]},
  {"type":"paragraph","children":[
    {"type":"plain_text","text":"本ガイドラインは、AI の使用に関する基本的なルールと推奨事項を提供するものであり、適切な運営とユーザーの理解を促進することを目的とする"}
  ]},..(省略)..]}'
</Input>
<Output>
'{"comment":"ガイドライン文書は、法律に従った曖昧性を排除した文書であるべきである。この部分は主語が欠落しており、曖昧性が生じている。",
  "selectedDraft":[
    {"type":"heading","level":1,"children":[{"type":"plain_text","text":"AI に関するガイドライン"}]},
    {"type":"paragraph","children":[
      {"type":"plain_text","text":"本ガイドラインは、AI の使用に関する基本的なルールと推奨事項を提供するものであり、"},
      {"type":"selected_text","text":"適切な運営", "selected": true },
      {"type":"plain_text","text":"とユーザーの理解を促進することを目的とする"}
    ]},..(省略)..
  ],
}'
</Output>
        `},
        { role: "user", content: JSON.stringify(draft) },
      ],
      response_format: OpenAIClaimResponseFormat,
    });
    const plainDraftResponse = completion.choices[0]?.message;
    console.log(completion.choices[0].message);

    if (plainDraftResponse.refusal) {
      console.error("OpenAI API Error:", plainDraftResponse.refusal);
      return prevClaim;
    }
    
    return plainDraftResponse.parsed?.claim ?? prevClaim;

  } catch (error) {
    console.error("OpenAI API Error:", error);
    return prevClaim;
  }
}
