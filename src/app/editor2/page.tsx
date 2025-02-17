'use client';

import CommonClaimerAction, { Claim } from "@/api/_agent/CommonClaimer";
import CommonDraftWriterAction from "@/api/_agent/CommonDraftWriter";
import Button from "@/components/Button";
import { DraftContext, useDraftContext } from "@/components/DraftContext";
import DraftEditor from "@/components/DraftEditor";
import TextArea from "@/components/TextArea";
import { useState, useTransition } from "react";

export default function Editor2Page() {
  return (
    <DraftContext>
      <Editor2PageContent />
    </DraftContext>
  );
}

function Editor2PageContent() {
  const [draft, draftAccessor] = useDraftContext();

  const [request, setRequest] = useState("");
  const [isPendingWriteDraft, startWriteDraftTransition] = useTransition();
  
  function handleRequestWriteDraft() {
    startWriteDraftTransition(async () => {
      const newDraft = await CommonDraftWriterAction(draft, request);
      draftAccessor.replaceDraft(newDraft);
    });
  }

  const [claim, setClaim] = useState<Claim>({ selectedDraft: [], comment: "" });
  const [isPendingClaim, startClaimTransition] = useTransition();
  
  function handleRequestClaim() {
    startClaimTransition(async () => {
      const newClaim = await CommonClaimerAction(claim, draft);
      draftAccessor.replaceDraft(newClaim.selectedDraft);
      setClaim(newClaim);
    });
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
        onClick={handleRequestWriteDraft}
        disabled={!request}
        isLoading={isPendingWriteDraft}
      >
        ドラフトを作成
      </Button>
      <DraftEditor />

      <Button
        onClick={handleRequestClaim}
        disabled={draft.length === 0}
        isLoading={isPendingClaim}
      >
        問題点を指摘する
      </Button>
      {
        claim.selectedDraft.length > 0 &&
          <div>
            <TextArea
              label="問題点"
              value={claim.comment}
              onChange={() => {}}
            />
          </div>
      }
    </div>
  );
}
