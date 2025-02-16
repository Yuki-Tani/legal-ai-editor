"use client";

import Button from "../../_components/Button";
import TextArea from "../../_components/TextArea";

export default function HearingPage() {
  return (
    <div>
      <h2>component sample</h2>

      <div>
        <h3>button</h3>
        <p>何回でも押せる</p>
        <Button
          buttonText="button"
          handleClicked={() => console.log("clicked!")}
        />

        <p>一度だけ</p>
        <Button
          buttonText="button"
          handleClicked={() => console.log("clicked!")}
          onlyOnce
        />
        <p>ローディングアニメーション(AI風)</p>
        <Button
          buttonText="button"
          handleClicked={() => console.log("clicked!")}
          onlyOnce
          useLoadingAnimation
          // type="ai_gradation"
        />

        <p>目立つ色</p>
        <Button
          buttonText="button"
          handleClicked={() => console.log("clicked!")}
          onlyOnce
          notice
        />
      </div>

      <div>
        <h3>TextArea</h3>
        <TextArea onChange={() => console.log("changed!")}></TextArea>

        <TextArea
          onChange={() => console.log("changed!")}
          label="ラベル付きテキストエリア"
          placeholder="ここに記入してください…"
        ></TextArea>
      </div>
    </div>
  );
}
