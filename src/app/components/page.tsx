"use client";

import Button from "./Button";
import TextArea from "./TextArea";

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
        />
      </div>

      <div>
        <h3>TextArea</h3>
        <TextArea handleChanged={() => console.log("changed!")}></TextArea>

        <TextArea
          handleChanged={() => console.log("changed!")}
          label="ラベル付きテキストエリア"
          placeholder="ここに記入してください…"
        ></TextArea>
      </div>
    </div>
  );
}
