import { Range } from "slate";
import { Agent } from "./Agent";
import { Draft } from "./Draft";

export type CommentType = "pointout" | "discuss" | "suggest" | "agree";

export type CommentRequest = {
  id: string,
  agent: Agent,
  type?: CommentType,
}

export type Comment = {
  id: string,
  agent: Agent,
  type: CommentType,
  message: string,
  draft?: Draft, // 修飾されたドラフト. "pointout" | "suggest" の場合に有効
}

export type Discussion = {
  id: string,
  title: string,
  baseDraft: Draft,
  comments: Comment[],
  commentRequest: CommentRequest | null,
  isCompleted?: boolean,
  isActive?: boolean,
  selectedText?: string,
  selectedRange?: Range,
  requirements?: string[],
}
