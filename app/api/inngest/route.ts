import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { extractDocument } from "@/inngest/functions/extract-document";
import { validateExtraction } from "@/inngest/functions/validate-extraction";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [extractDocument, validateExtraction],
});
