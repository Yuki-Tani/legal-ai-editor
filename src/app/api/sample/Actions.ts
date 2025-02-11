'use server'

// ref: [Server Action](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

// Server Action という形でサーバーで動作させる関数を定義すると、REST API を作成せずともクライアント/サーバー間のコミュニケーションができる。

export type SampleActionResult = { accountId: string, message: string };

export async function SampleAction(): Promise<SampleActionResult> {
  // サーバーサイドで動作する処理をここに記述する
  return { accountId: "ai-001", message: "This is sample message from Server Action." };
}