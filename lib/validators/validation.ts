import { z } from "zod";

/**
 * Per-field comparison result produced by Claude Sonnet when cross-checking
 * a Gemini extraction. Each field gets an agreement verdict and Claude's own value.
 */
export const fieldComparisonSchema = z.object({
  agrees: z.boolean(),
  geminiValue: z.string().nullable(),
  claudeValue: z.string().nullable(),
  note: z.string().optional(),
});

export type FieldComparison = z.infer<typeof fieldComparisonSchema>;

/**
 * Full validation output from Claude Sonnet.
 * `fields` is keyed by extraction field name (e.g. "totalCost", "customerName").
 */
export const validationOutputSchema = z.object({
  fields: z.record(z.string(), fieldComparisonSchema),
  overallAgreement: z.number().min(0).max(1),
  summary: z.string(),
});

export type ValidationOutput = z.infer<typeof validationOutputSchema>;
