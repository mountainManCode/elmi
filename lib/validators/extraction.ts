import { z } from "zod";

/**
 * Wraps any Zod type in a { value, confidence } object.
 * The AI model returns a confidence score (0–1) for each extracted field.
 */
function fieldWithConfidence<T extends z.ZodType>(schema: T) {
  return z.object({
    value: schema,
    confidence: z.number().min(0).max(1),
  });
}

/** Nullable variant — for optional fields the AI may not find in the document. */
function optionalFieldWithConfidence<T extends z.ZodType>(schema: T) {
  return z.object({
    value: schema.nullable(),
    confidence: z.number().min(0).max(1),
  });
}

/**
 * Structured extraction schema for environmental permits and utility bills.
 * Every field is wrapped in { value, confidence } so the verification UI
 * can highlight low-confidence fields for human review.
 */
export const extractionSchema = z.object({
  // Document identification
  documentType: fieldWithConfidence(z.string()),
  permitNumber: optionalFieldWithConfidence(z.string()),
  accountNumber: optionalFieldWithConfidence(z.string()),

  // Facility / entity info
  facilityName: optionalFieldWithConfidence(z.string()),
  facilityAddress: optionalFieldWithConfidence(z.string()),
  applicant: optionalFieldWithConfidence(z.string()),
  issuingAuthority: optionalFieldWithConfidence(z.string()),

  // Dates
  issueDate: optionalFieldWithConfidence(z.string()),
  expirationDate: optionalFieldWithConfidence(z.string()),
  billingPeriodStart: optionalFieldWithConfidence(z.string()),
  billingPeriodEnd: optionalFieldWithConfidence(z.string()),

  // Utility data
  utilityType: optionalFieldWithConfidence(z.string()),
  consumption: optionalFieldWithConfidence(z.number()),
  consumptionUnit: optionalFieldWithConfidence(z.string()),
  totalCost: optionalFieldWithConfidence(z.number()),
  currency: optionalFieldWithConfidence(z.string()),

  // Arrays
  conditions: fieldWithConfidence(z.array(z.string())),
  emissionsLimits: fieldWithConfidence(z.array(z.string())),

  // Metadata
  extractionNotes: fieldWithConfidence(z.string()),
  pageCount: fieldWithConfidence(z.number()),
});

export type ExtractionData = z.infer<typeof extractionSchema>;

/**
 * Compute an overall confidence score by averaging all field-level confidences.
 * Only includes fields that have a non-null value.
 */
export function computeOverallConfidence(data: ExtractionData): number {
  const fields = Object.values(data) as Array<{
    value: unknown;
    confidence: number;
  }>;

  const scored = fields.filter((f) => f.value !== null);
  if (scored.length === 0) return 0;

  const sum = scored.reduce((acc, f) => acc + f.confidence, 0);
  return sum / scored.length;
}
