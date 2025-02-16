'use client'

import React from "react";
import { Draft, emptyDraft } from "../_types/Draft";
import DraftEditor from "../_components/DraftEditor";
import { DraftEditorFocusedRangePopup } from "../_components/DraftEditorPopup";
import { useDraftAccessorContext } from "../_components/DraftContext";


export default function SampleDraftEditor(): React.ReactElement {
  const draftAccessor = useDraftAccessorContext();

  return (
    <div>
      <DraftEditor
        renderExtensions={({ isEditorFocused }) => (
          <DraftEditorFocusedRangePopup
            isEditorFocused={isEditorFocused}
            style={{ margin: 6, backgroundColor: "white", border: "1px solid black" }}
          >
            <div>
              <button
                style={{
                  border: "2px solid black",
                  padding: 4, borderRadius: 6, boxShadow: "2px 2px 2px gray",
                  outline: "none", cursor: "pointer"
                }}
                onClick={() => draftAccessor.applySelectionToExpandedRange()}
              >
                🚩議論を始める
              </button>
            </div>
          </DraftEditorFocusedRangePopup>
        )}
      />
      <button onClick={() => draftAccessor.replaceDraft(emptyDraft)}>Reset</button>
      <button onClick={() => draftAccessor.replaceDraft(sampleDraft)}>Set Sample</button>
    </div>
  )
}

const sampleDraft: Draft = [
  { type: 'heading', level: 1, children: [{ text: '利用規約' }] },
  { type: 'paragraph', children: [{ text: '本利用規約（以下、「本規約」といいます。）は、当社が提供するサービス（以下、「本サービス」といいます。）の利用条件を定めるものです。' }] },
  
  { type: 'heading', level: 2, children: [{ text: '第1条（適用）' }] },
  { type: 'paragraph', children: [{ text: '本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されます。' }] },

  { type: 'heading', level: 2, children: [{ text: '第2条（利用登録）' }] },
  { type: 'paragraph', children: [
    { text: '本サービスにおいては、登録希望者が本規約に同意の上、当社の定める方法によって利用登録を申請し、' },
    { text: '当社がこれを承認することによって、利用登録が完了するものとします。', selected: true }
  ]},

  { type: 'heading', level: 2, children: [{ text: '第3条（禁止事項）' }] },
  { type: 'paragraph', children: [
    { text: 'ユーザーは、本サービスの利用にあたり、以下の行為をしては' },
    { text: 'なりません。', suggested: true, suggestion: 'いけません。' }
  ]},
  { type: 'paragraph', children: [
    { text: '1. 法令または公序良俗に違反する行為' }
  ]},
  { type: 'paragraph', children: [
    { text: '2. 犯罪行為に関連する行為' }
  ]},
  { type: 'paragraph', children: [
    { text: '3. 本サービスの運営を妨害する行為' }
  ]},

  { type: 'heading', level: 2, children: [{ text: '第4条（免責事項）' }] },
  { type: 'paragraph', children: [
    { text: '当社は、本サービスに関して、' },
    { text: 'いかなる', selected: true },
    { text: '保証', selected: true, suggested: true, suggestion: '賠償' },
    { text: 'も行わず', selected: true },
    { text: '、一切の責任を負わないものとします。' }
  ]}
];