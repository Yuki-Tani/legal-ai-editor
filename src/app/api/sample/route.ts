'use server'

import { NextResponse } from "next/server";

// ref: [Route Handler](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

// Route Handler を定義すれば、簡単に REST API エンドポイントを作成することができる。
// route.ts ファイルの保存場所（app/ 以下のパス）がそのままエンドポイントのパスとなる。 
// つまりこのファイルの場合、`app/api/sample` に保存されているので [http://localhost:3000/api/sample](http://localhost:3000/api/sample) に対して GET リクエストを送ると、この関数がサーバーで動作し、レスポンスを返す。
// クライアントコンポーネントから作成した REST API を使う場合は、fetch を使ってリクエストを送る。(参考：`app/sample/SampleCallingRouteHandler.tsx`)

// ただし、Next.js でクライアントも作成する場合は、Server Action を使う方が便利。（参考：./action.ts）

export async function GET() {
  return NextResponse.json({ accountId: "ai-001", message: "This is sample message from REST API (Route Handler)" });
}