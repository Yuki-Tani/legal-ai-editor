import { Discussion } from "@/types/Discussion";
import { AgentRequestType } from "./types";
import { Range } from "slate";

export function mapCommentTypeToRequestType(type: string | undefined): AgentRequestType {
  switch (type) {
    case "pointout":
      return "requestOpinion";     // pointout => requestOpinion
    case "discuss":
      return "requestComment";     // discuss  => requestComment
    case "suggest":
      return "requestSuggestion";  // suggest  => requestSuggestion
    default:
      return "requestComment";     // fallback
  }
}


export function getSelectedTextFromDiscussion(discussion: Discussion, label?: string): string {
  if (discussion.selectedRange) {
    return `選択範囲の文字列(${label ?? "Common"})`;
  }
  return "";
}
