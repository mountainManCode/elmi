// Supplier Upload Portal — Server Component
// Validates the magic-link token at request time, then renders the dropzone.
// No login required.

import { Alert, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { validateToken } from "./actions";
import { SupplierDropzone } from "./_components/supplier-dropzone";

type Props = { params: Promise<{ token: string }> };

export default async function SupplierUploadPage({ params }: Props) {
  const { token } = await params;
  const result = await validateToken(token);

  if (!result.valid) {
    return (
      <Alert
        variant="light"
        color="red"
        title="Link unavailable"
        icon={<IconAlertCircle size={16} />}
      >
        {result.reason}
      </Alert>
    );
  }

  return (
    <>
      <Title order={2} mb="md">
        Upload your documents
      </Title>
      <SupplierDropzone
        token={token}
        uploadCount={result.uploadCount}
        maxUploads={result.maxUploads}
      />
    </>
  );
}
