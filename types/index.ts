// Shared domain types
// Prefer co-locating types with their feature; only put truly global types here.

export type UserRole = "consultant" | "supplier";

export type ExtractionStatus =
  | "pending"
  | "extracting"
  | "validating"
  | "needs_review"
  | "approved"
  | "rejected";

export type ExportFormat = "cyf" | "aclymate" | "persefoni";
