import { z } from "zod";

export const IdeaInterviewerResponseScheme = z.object({
  requirements: z.array(z.string()),
});

export type IdeaInterviewerRequest = {
  label: string;
  userRequirement: string;
};

export type IdeaInterviewerResponse = {
  requirements: string[];
};
