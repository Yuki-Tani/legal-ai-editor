import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const PlainTextScheme = z.object({
  type: z.literal("plain_text"),
  text: z.string(),
}).required();

const SelectedTextScheme = z.object({
  type: z.literal("selected_text"),
  text: z.string(),
  selected: z.literal(true),
  ids: z.array(z.string()),
}).required({
  type: true,
  text: true,
  selected: true,
});

const SuggestedTextScheme = z.object({
  type: z.literal("suggested_text"),
  text: z.string(),
  suggested: z.literal(true),
  suggestion: z.string(),
}).required();

const DraftTextScheme = z.union([
  PlainTextScheme,
  SelectedTextScheme,
  SuggestedTextScheme
]);

const ParagraphElementScheme = z.object({
  type: z.literal("paragraph"),
  children: z.array(DraftTextScheme),
}).required();

const HeadingElementScheme = z.object({
  type: z.literal("heading"),
  level: z.number().int(),
  children: z.array(DraftTextScheme),
}).required();

const DraftElementScheme = z.union([
  ParagraphElementScheme,
  HeadingElementScheme
]);

const DraftScheme = z.object({draft: z.array(DraftElementScheme)});
export const OpenAIDraftResponseFormat = zodResponseFormat(DraftScheme, "draft_response");

const ClaimScheme = z.object({claim: z.object({
  comment: z.string(),
  selectedDraft: z.array(DraftElementScheme),
})});
export const OpenAIClaimResponseFormat = zodResponseFormat(ClaimScheme, "claim_response");

// === plains ===

const PlainParagraphElementScheme = z.object({
  type: z.literal("paragraph"),
  children: z.array(PlainTextScheme),
}).required();

const PlainHeadingElementScheme = z.object({
  type: z.literal("heading"),
  level: z.number().int(),
  children: z.array(PlainTextScheme),
}).required();

const PlainDraftElementScheme = z.union([
  PlainParagraphElementScheme,
  PlainHeadingElementScheme
]);

const PlainDraftScheme = z.object({draft: z.array(PlainDraftElementScheme)});
export const OpenAIPlainDraftResponseFormat = zodResponseFormat(PlainDraftScheme, "draft_response");
