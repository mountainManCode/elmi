"use client";
import { Box, Button, Text } from "@mantine/core";
export default function VerificationError({ reset }: { reset: () => void }) {
  return (
    <Box style={{ padding: "80px 24px", textAlign: "center" }}>
      <Text c="dimmed" size="sm" mb="sm">Could not load verification workspace.</Text>
      <Button size="xs" variant="light" onClick={reset}>Try again</Button>
    </Box>
  );
}
