import { EventSchemas, Inngest } from "inngest";

// Type-safe event definitions for the Elmi pipeline.
// Each key is a dot-delimited event name; the value defines `data`.
type Events = {
  "elmi/document.uploaded": {
    data: {
      documentId: string;
      orgId: string;
      projectId: string;
      gcsPath: string;
    };
  };
  "elmi/extraction.completed": {
    data: {
      documentId: string;
      orgId: string;
      projectId: string;
      success: boolean;
    };
  };
  "elmi/validation.completed": {
    data: {
      documentId: string;
      orgId: string;
      projectId: string;
      success: boolean;
      overallAgreement: number;
    };
  };
};

export const inngest = new Inngest({
  id: "elmi",
  schemas: new EventSchemas().fromRecord<Events>(),
});

export type { Events };
