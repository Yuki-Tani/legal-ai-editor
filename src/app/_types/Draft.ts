import { Editor, Selection, Text, Transforms, Range } from "slate"
import { ReactEditor } from "slate-react";

////////////////////////////////////////
// Draft
// NOTE: If you touch this definition, maybe you should also touch ./DraftResponseFormat.ts

export type Draft = (DraftElement | DraftText)[];

export type DraftElement =
  { type: 'paragraph', children: DraftText[] } |
  { type: 'heading', level: number, children: DraftText[] }
;

export type DraftText =
  { text: string } |
  { text: string, selected: true, ids?: string[] } |
  { text: string, suggested: true, suggestion: string }
;

////////////////////////////////////////

export type DraftSelection = Selection;

export const emptyDraft: Draft = [{ type: 'paragraph', children: [{ text: '' }] }];

export class DraftAccessor {
  constructor(public readonly editor: Editor) {}

  public logString(): void {
    console.log(Editor.string(this.editor, []));
  }

  public isDraftEmpty(): boolean {
    return Editor.string(this.editor, []).trim() === '';
  }

  public isRangeExpanded(): boolean {
    if (!this.editor.selection) return false;
    return Range.isExpanded(this.editor.selection);
  }

  public getCurrentRange(): Range | null {
    if (!this.editor.selection) {
      return null;
    }
    return this.editor.selection;
  }

  public getAnchorCursorForLayout(): DOMRect | undefined {
    const selection = this.editor.selection;
    if (!selection) return undefined;
    const anchorRange = ReactEditor.toDOMRange(this.editor, {
      anchor: selection.anchor,
      focus: selection.anchor,
    });
    return anchorRange.getBoundingClientRect();
  }

  public getFocusCursorForLayout(): DOMRect | undefined {
    const selection = this.editor.selection;
    if (!selection) return undefined;
    const focusRange = ReactEditor.toDOMRange(this.editor, {
      anchor: selection.focus,
      focus: selection.focus,
    });
    return focusRange.getBoundingClientRect();
  }

  public replaceDraft(draft: Draft): void {
    this.editor.children = draft;
    Transforms.select(this.editor, [0, 0]);
  }

  public applySelection(selection: DraftSelection, id?: string): void {
    if (!selection) return;

    Transforms.setSelection(this.editor, selection);
    this.editor.addMark("selected", true);

    if (id) {
      const nodes = Editor.nodes(this.editor, {
        at: selection,
        match: n => Text.isText(n),
      });
      for (const [node, path] of nodes) {
        if (Text.isText(node) && 'selected' in node) {
          const idSet = new Set(node.ids).add(id);
          Transforms.setNodes(this.editor, { ids: [...idSet] }, { at: path });
        }
      }
    }
  }

  public applySelectionToExpandedRange(id?: string): void {
    const selection = this.editor.selection;
    if (!selection) return;
    this.applySelection(selection, id);
  }

  public getTextInRange(range: Range): string {
    try {
      return Editor.string(this.editor, range);
    } catch (error) {
      console.error("Failed to get text in range:", error);
      return "";
    }
  }

  public getSelectedText(): string {
    const range = this.getCurrentRange();
    if (!range) return "";
    try {
      return Editor.string(this.editor, range);
    } catch (error) {
      console.error("Failed to get selected text:", error);
      return "";
    }
  }
}