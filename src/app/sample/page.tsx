import Link from "next/link";
import { DraftContext } from "../_components/DraftContext";
import SampleCallingRouteHandler from "./SampleCallingRouteHandler";
import SampleCallingServerAction from "./SampleCallingServerAction";
import SampleCommonDraftWriter from "./SampleCommonDraftWriter";
import SampleDraftEditor from "./SampleDraftEditor";
import NagurigakiView from "./NagurigakiView";

// NEXT.js では、page.tsx というファイル名のファイルを定義するだけで、URL に対応するページが作成される。
// このファイルの場合、[http://localhost:3000/sample](http://localhost:3000/sample) にアクセスすると、このコンポーネントのページが表示される。
// 祖先ディレクトリに layout.tsx が存在する場合、layout.tsx + page.tsx でページが構成される。

export default function SamplePage() {


  return (
    <div>
      <h2>サンプルページ</h2>

      <Link href="/doc-editor"> ドキュメントエディタへ </Link>
      <br />
      <Link href="/sample"> サンプルページへ </Link>
      <br />
      <Link href="/interaction">インタラクションのテスト</Link> 

      <br />
      <Link href="/hearing"> ドラフト作成ヒアリングページへ </Link>

      <br />
      <Link href="/sample/components"> コンポーネントのサンプルページへ </Link>

      <NagurigakiView />

      <h3>REST API を Route Handler を使って定義し、呼び出しを行うサンプル</h3>
      <SampleCallingRouteHandler />
      <h3>Server Action を使って定義し、呼び出しを行うサンプル</h3>
      <SampleCallingServerAction />
      <DraftContext>
        <h3>Rich Editor Sample</h3>
        <SampleDraftEditor />
      </DraftContext>
      <DraftContext>
        <h3>CommonDraftWriter</h3>
        <SampleCommonDraftWriter />
      </DraftContext>
    </div>
  );
}
