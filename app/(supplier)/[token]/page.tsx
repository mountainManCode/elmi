// Supplier Upload Portal — Server Component
// Resolves magic link token, renders the dropzone.
// No login required.

type Props = { params: Promise<{ token: string }> };

export default async function SupplierUploadPage({ params }: Props) {
  const { token } = await params;

  return (
    <div>
      <h1>Upload your documents</h1>
      {/* TODO: validate token, render Dropzone component */}
    </div>
  );
}
