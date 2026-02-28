import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
// Import functions here as you create them:
// import { extractDocument } from "@/inngest/functions/extract-document";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // extractDocument,
  ],
});
