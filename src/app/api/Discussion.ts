import { Discussion } from "@/types/Discussion";
import { NextCommentorPickerAction } from "./_agent/AgentPicker";
import { AgentAction } from "./_agent/AgentPool";
import { Agent, AgentPool } from "@/types/Agent";

export async function DiscussionAction(request: Discussion, candidate?: Agent[]): Promise<Discussion> {

  if (!request.commentRequest) {
    const nextCommenter = await NextCommentorPickerAction({ discussion: request, candidate: candidate ?? AgentPool });
    request.commentRequest = {
      id: `comment-${request.comments.length}`,
      agent: nextCommenter.agent,
      type: nextCommenter.expectedCommentType,
    }
  }

  const comments = await AgentAction(request);
  request.comments.push(...comments);
  request.commentRequest = null;

  return request;
}