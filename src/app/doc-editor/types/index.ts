export interface SelectionRange {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  comments: CommentData[];
  replacement: string;
  isAccepted: boolean;
}

export interface CommentData {
  id: string;
  author: string;
  content: string;
}
