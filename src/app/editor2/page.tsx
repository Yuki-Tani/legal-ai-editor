'use client';

import CommonDraftWriterAction from "@/api/_agent/CommonDraftWriter";
import Button from "@/components/Button";
import { DraftContext, useDraftAccessorContext } from "@/components/DraftContext";
import DraftEditor from "@/components/DraftEditor";
import TextArea from "@/components/TextArea";
import { startTransition, useActionState, useState } from "react";

export default function Editor2Page() {
  return (
    <DraftContext>
      <Editor2PageContent />
    </DraftContext>
  );
}

function Editor2PageContent() {
  const draftAccessor = useDraftAccessorContext();

  const [request, setRequest] = useState("");
  const [draft, updateDraftAction, isPending] = useActionState(CommonDraftWriterAction, []);
  const [prevDraft, setPrevDraft] = useState(draft);

  function handleRequest() {
    startTransition(async () => {
      await updateDraftAction(request);
    });
  }

  if (draft !== prevDraft) {
    setPrevDraft(draft);
    draftAccessor.replaceDraft(draft);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <TextArea
        label="リクエスト"
        placeholder="作成するドラフトの種類・要望を入力"
        value={request}
        onChange={(value) => setRequest(value)}
      />
      <Button
        onClick={handleRequest}
        disabled={!request}
        isLoading={isPending}
      >
        ドラフトを作成
      </Button>
      <DraftEditor />
    </div>
  );
}
