"use client";

import { useState, useCallback } from "react";
import {
  Stack,
  Text,
  Badge,
  Card,
  Group,
  Progress,
  ThemeIcon,
} from "@mantine/core";
import { Dropzone, PDF_MIME_TYPE } from "@mantine/dropzone";
import { notifications } from "@mantine/notifications";
import {
  IconUpload,
  IconFileTypePdf,
  IconX,
  IconCheck,
  IconLoader,
} from "@tabler/icons-react";
import { getUploadUrl, confirmUpload } from "../actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FileStatus = {
  name: string;
  progress: number;
  state: "uploading" | "confirming" | "done" | "error";
  error?: string;
};

type Props = {
  token: string;
  uploadCount: number;
  maxUploads: number;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SupplierDropzone({ token, uploadCount, maxUploads }: Props) {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [currentCount, setCurrentCount] = useState(uploadCount);

  const remaining = maxUploads - currentCount;
  const limitReached = remaining <= 0;

  const updateFile = useCallback(
    (name: string, update: Partial<FileStatus>) => {
      setFiles((prev) =>
        prev.map((f) => (f.name === name ? { ...f, ...update } : f)),
      );
    },
    [],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      // 1. Get signed upload URL from server
      const urlResult = await getUploadUrl(token, file.name);
      if (!urlResult.success) {
        updateFile(file.name, { state: "error", error: urlResult.error });
        return;
      }

      const { uploadUrl, documentId, gcsPath } = urlResult;

      // 2. PUT file directly to GCS with progress tracking
      try {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", "application/pdf");

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              updateFile(file.name, { progress: pct });
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.send(file);
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed";
        updateFile(file.name, { state: "error", error: message });
        return;
      }

      // 3. Confirm upload on server (creates Document, fires Inngest event)
      updateFile(file.name, { state: "confirming", progress: 100 });
      const confirmResult = await confirmUpload(
        token,
        documentId,
        gcsPath,
        file.name,
      );

      if (!confirmResult.success) {
        updateFile(file.name, { state: "error", error: confirmResult.error });
        return;
      }

      updateFile(file.name, { state: "done" });
      setCurrentCount((c) => c + 1);
      notifications.show({
        title: "Upload complete",
        message: `${file.name} uploaded successfully.`,
        color: "green",
        icon: <IconCheck size={16} />,
      });
    },
    [token, updateFile],
  );

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Limit files to remaining quota
      const batch = acceptedFiles.slice(0, maxUploads - currentCount);

      const newEntries: FileStatus[] = batch.map((f) => ({
        name: f.name,
        progress: 0,
        state: "uploading" as const,
      }));

      setFiles((prev) => [...prev, ...newEntries]);

      // Upload files concurrently
      batch.forEach((file) => uploadFile(file));
    },
    [currentCount, maxUploads, uploadFile],
  );

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {currentCount} of {maxUploads} uploads used
        </Text>
        <Badge color={remaining <= 2 ? "orange" : "blue"} variant="light">
          {remaining} remaining
        </Badge>
      </Group>

      <Dropzone
        onDrop={handleDrop}
        onReject={(fileRejections) => {
          fileRejections.forEach((r) => {
            notifications.show({
              title: "File rejected",
              message: `${r.file.name}: ${r.errors.map((e) => e.message).join(", ")}`,
              color: "red",
            });
          });
        }}
        maxSize={50 * 1024 * 1024}
        accept={PDF_MIME_TYPE}
        disabled={limitReached}
      >
        <Group
          justify="center"
          gap="xl"
          mih={160}
          style={{ pointerEvents: "none" }}
        >
          <Dropzone.Accept>
            <IconUpload size={48} stroke={1.5} />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size={48} stroke={1.5} />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconFileTypePdf size={48} stroke={1.5} />
          </Dropzone.Idle>

          <div>
            <Text size="lg" inline>
              {limitReached
                ? "Upload limit reached"
                : "Drag PDFs here or click to browse"}
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              PDF files only, up to 50 MB each
            </Text>
          </div>
        </Group>
      </Dropzone>

      {/* Per-file status cards */}
      {files.map((f) => (
        <Card key={f.name} withBorder padding="sm">
          <Group justify="space-between" mb={f.state === "uploading" ? "xs" : 0}>
            <Group gap="sm">
              <ThemeIcon
                variant="light"
                color={
                  f.state === "done"
                    ? "green"
                    : f.state === "error"
                      ? "red"
                      : "blue"
                }
                size="sm"
              >
                {f.state === "done" && <IconCheck size={14} />}
                {f.state === "error" && <IconX size={14} />}
                {(f.state === "uploading" || f.state === "confirming") && (
                  <IconLoader size={14} />
                )}
              </ThemeIcon>
              <Text size="sm" truncate style={{ maxWidth: 300 }}>
                {f.name}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {f.state === "uploading" && `${f.progress}%`}
              {f.state === "confirming" && "Processing..."}
              {f.state === "done" && "Complete"}
              {f.state === "error" && f.error}
            </Text>
          </Group>
          {f.state === "uploading" && (
            <Progress value={f.progress} size="sm" animated />
          )}
        </Card>
      ))}
    </Stack>
  );
}
