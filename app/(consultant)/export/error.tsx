"use client";
import { Box, Button, Text } from "@mantine/core";
export default function ExportError({ reset }: { reset: () => void }) {
  return (
    <Box style={{ padding: "80px 24px", textAlign: "center" }}>
      <Text c="dimmed" size="sm" mb="sm">Could not load export manager.</Text>
      <Button size="xs" variant="light" onClick={reset}>Try again</Button>
    </Box>
  );
}
