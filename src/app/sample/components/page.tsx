"use client";

import { useState } from "react";
import Button from "../../_components/Button";
import TextArea from "../../_components/TextArea";

export default function HearingPage() {
  const [area1, setArea1] = useState("");
  const [area2, setArea2] = useState("");

  return (
    <div>
      <h2>component sample</h2>

      <div>
        <h3>button</h3>
        <p>何回でも押せる</p>
        <Button onClick={() => console.log("clicked!")}>button</Button>

        <p>一度だけ</p>
        <Button onClick={() => console.log("clicked!")} onlyOnce>button</Button>
        <p>ローディングアニメーション(AI風)</p>
        <Button
          onClick={() => console.log("clicked!")}
          onlyOnce
          useLoadingAnimation
        >
          button
        </Button>
      </div>

      <div>
        <h3>TextArea</h3>
        <TextArea value={area1} onChange={(value) => { setArea1(value); console.log("changed!"); }}></TextArea>

        <TextArea
          value={area2}
          onChange={(value) => { setArea2(value); console.log("changed!"); }}
          label="ラベル付きテキストエリア"
          placeholder="ここに記入してください…"
        ></TextArea>
      </div>
    </div>
  );
}
