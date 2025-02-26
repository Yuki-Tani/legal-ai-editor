import { Editor, Selection, Text, Transforms, Range, Path } from "slate"
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

  public getSelectedText(): string[] {
    const nodes = Editor.nodes(this.editor, {
      match: n => Text.isText(n) && 'selected' in n,
    });
    return Array.from(nodes).map(([node]) => node.text);
  }

  public removeAllMarks(): void {
    for (const [node, path] of Editor.nodes(this.editor, {
      at: [],
      match: n => Text.isText(n) && ('selected' in n || 'suggested' in n),
    })) {
      if ('selected' in node) {
        Transforms.unsetNodes(this.editor, 'selected', { at: path });
      }
      if ('suggested' in node) {
        Transforms.unsetNodes(this.editor, 'suggested', { at: path });
        Transforms.unsetNodes(this.editor, 'suggestion', { at: path });
      }
    }
  }

  public createSuggestion(updaters: { from: string, to: string}[]): void {
    this.removeAllMarks()
    for (const { from, to } of updaters)
    {
      for (const [node, path] of Editor.nodes(this.editor, {
        at: [],
        match: n => Text.isText(n),
      })) {
        if ((Editor.parent(this.editor, path)[0] as DraftElement).type !== 'paragraph')
        {
          continue; // TORIAEZU: paragraph 以外は無視
        }
        
        const index = node.text.indexOf(from);
        if (index !== -1) {
          Transforms.select(this.editor, Editor.range(this.editor, { anchor: { path, offset: index }, focus: { path, offset: index + from.length } }));
          this.editor.addMark("suggested", true);
          this.editor.addMark("suggestion", to);
          return; // TORIAEZU: １箇所だけ
        }
      }
    }
  }

  public applySuggestion(): void {
    for (const [node, path] of Editor.nodes(this.editor, {
      at: [],
      match: n => Text.isText(n) && 'suggested' in n,
    })) {
      Transforms.select(this.editor, Editor.range(this.editor, path));
      Transforms.insertText(this.editor, node.suggestion);
      Transforms.select(this.editor, Editor.range(this.editor, path));
      this.editor.removeMark("suggested");
      this.editor.removeMark("suggestion");
    }
  }
}