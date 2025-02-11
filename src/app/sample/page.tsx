import SampleCallingRouteHandler from "./SampleCallingRouteHandler";
import SampleCallingServerAction from "./SampleCallingServerAction";

// NEXT.js では、page.tsx というファイル名のファイルを定義するだけで、URL に対応するページが作成される。
// このファイルの場合、[http://localhost:3000/sample](http://localhost:3000/sample) にアクセスすると、このコンポーネントのページが表示される。
// 祖先ディレクトリに layout.tsx が存在する場合、layout.tsx + page.tsx でページが構成される。

export default function SamplePage() {
  return (
    <div>
      <h2>サンプル</h2>
      <h3>REST API を Route Handler を使って定義し、呼び出しを行うサンプル</h3>
      <SampleCallingRouteHandler />
      <h3>Server Action を使って定義し、呼び出しを行うサンプル</h3>
      <SampleCallingServerAction />
    </div>
  );
}
