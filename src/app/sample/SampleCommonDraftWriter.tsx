'use client'

import React, { startTransition, useActionState } from "react";
import CommonDraftWriterAction from "@/api/_agent/CommonDraftWriter";
import { useDraftAccessorContext } from "@/components/DraftContext";
import DraftEditor from "@/components/DraftEditor";

export default function SampleCommonDraftWriter(): React.ReactElement {
  const draftAccessor = useDraftAccessorContext();
  const [draft, action, isPending] = useActionState(CommonDraftWriterAction, []);
  const [prevDraft, setPrevDraft] = React.useState(draft);

  const [request, setRequest] = React.useState("");

  async function handleRequest() {
    startTransition(async () => {
      await action(request);
    });
  }

  if (draft !== prevDraft) {
    setPrevDraft(draft);
    draftAccessor.replaceDraft(draft);
  }
  
  return (
    <div>
      <DraftEditor />
      <textarea value={request} onChange={(e) => setRequest(e.target.value)} />
      <button onClick={handleRequest} disabled={isPending}>Request</button>
    </div>
  )
}