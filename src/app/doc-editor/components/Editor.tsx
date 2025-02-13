'use client';

import React, { useRef, useState, useEffect } from "react";

interface EditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onTextSelect: (selectedText: string, startOffset: number, endOffset: number) => void;
}

interface TempHighlight {
  span: HTMLSpanElement;
  x: number;
  y: number;
  selectedText: string;
}

const Editor: React.FC<EditorProps> = ({
  content,
  onContentChange,
  onTextSelect,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const [tempHighlight, setTempHighlight] = useState<TempHighlight | null>(null);
  const [originalHTML, setOriginalHTML] = useState<string>("");

  // マウスアップ時：選択範囲を黄色でハイライトし、ポップアップを表示
  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return; // 選択がない場合は何もしない

    // キャンセル用に現在のHTMLを保存
    if (editorRef.current) {
      setOriginalHTML(editorRef.current.innerHTML);
    }

    // 選択範囲を抜き出し、黄色の <span> でラップ
    const extractedContents = range.extractContents();
    const highlightSpan = document.createElement("span");
    highlightSpan.style.backgroundColor = "yellow";
    highlightSpan.appendChild(extractedContents);
    range.insertNode(highlightSpan);

    // Editor 内での相対座標を計算（X: 最大幅制限あり、Y: 下に20px分シフト）
    const editorRect = editorRef.current?.getBoundingClientRect();
    if (!editorRect) return;
    let x = e.clientX - editorRect.left;
    let y = e.clientY - editorRect.top;
    if (y < 0) y = 0;
    const editorWidth = editorRect.width;
    const limitX = editorWidth - 200; // 例: ポップアップ幅 200px分余裕を持たせる
    if (x > limitX) {
      x = limitX;
    }

    const selectedText = highlightSpan.innerText;

    setTempHighlight({
      span: highlightSpan,
      x,
      y,
      selectedText,
    });

    // 標準の青色選択ハイライトを解除
    selection.removeAllRanges();

    // 更新後のHTMLを親に反映
    if (editorRef.current) {
      onContentChange(editorRef.current.innerHTML);
    }
  };

  // 「はい」ボタン：黄色ハイライト状態を確定し、コメント作成情報を親に通知
  const handleConfirm = () => {
    if (!tempHighlight || !editorRef.current) return;

    const { selectedText } = tempHighlight;
    const fullText = editorRef.current.innerText;
    const startOffset = fullText.indexOf(selectedText);
    const endOffset = startOffset + selectedText.length;

    onTextSelect(selectedText, startOffset, endOffset);

    onContentChange(editorRef.current.innerHTML);

    setTempHighlight(null);
  };

  // 「いいえ」ボタン、またはポップアップ外クリック時：ハイライト前の状態に戻す
  const handleCancel = () => {
    if (!tempHighlight || !editorRef.current) return;

    onContentChange(originalHTML);
    setTempHighlight(null);
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onContentChange((e.target as HTMLDivElement).innerHTML);
  };

  // ポップアップ外をクリックした場合、handleCancel() を呼び出す処理
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        handleCancel();
      }
    };

    if (tempHighlight) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [tempHighlight]);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onMouseUp={handleMouseUp}
        style={{
          width: "100%",
          padding: "16px",
          boxSizing: "border-box",
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          minHeight: "400px",
          overflowY: "auto",
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* ポップアップ：tempHighlight が有効な場合のみ表示 */}
      {tempHighlight && (
        <div
          ref={popupRef}
          style={{
            position: "absolute",
            left: tempHighlight.x,
            top: tempHighlight.y,
            height: "60px",
            width: "200px",
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            padding: "8px",
            zIndex: 100,
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          <div>コメントを作成しますか？</div>
          <div style={{ marginTop: "8px", textAlign: "right" }}>
            <button onClick={handleConfirm} style={{ marginRight: "4px" }}>
              はい
            </button>
            <button onClick={handleCancel}>いいえ</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
