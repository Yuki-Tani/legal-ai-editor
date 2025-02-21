'use client'

import { startTransition, useActionState, useState, useTransition } from "react";
import { SearchAndGetTextAction } from "@/api/_egov/HoureiApi";
import { RequestAction as ReqeustActionToYesman } from "@/api/_agent/Yesman";
import { initalAgentState } from "@/api/_agent/types";

export default function NagurigakiView() {
  const [draft, setDraft] = useState("");
  const [isSearchPending, startSearchTransition] = useTransition();
  const [yesmanState, requestYesman, isYesmanPending] = useActionState(ReqeustActionToYesman, initalAgentState);

  async function handleSearch() {
    startSearchTransition(async () => {
      const result = await SearchAndGetTextAction("関税定率法");
      setDraft(result);
    });
  }

  async function handleAskAi() {
    startTransition(async () => {
      await requestYesman({ type: "requestOpinion", coreIdea: "", draft });
    });
  }

  return (
    <div>
      <h3>殴り書き</h3>
      <h4>ドラフト</h4>
      <textarea
        rows={10} cols={50}
        value={draft}
        onChange={e => { setDraft(e.target.value); }}
      />
      <div>
        <button onClick={handleSearch} disabled={isSearchPending}>「関税定率法」でe-Gov検索した最初の検索結果の法令をドラフトへ</button>
      </div>
      <div>
        <button onClick={handleAskAi} disabled={isYesmanPending}>AI に意見を求める</button>
        <div>
          { yesmanState.type === "answering" &&
              <div>
                <p>Yes-man が回答:</p>
                <p>{yesmanState.answer}</p>
              </div>
          }
        </div>
      </div>
    </div>
  );
}
