"use client";

import { Box, Button, Text } from "@mantine/core";

export default function SuppliersError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Box style={{ padding: "80px 40px", textAlign: "center" }}>
      <Text size="sm" c="dimmed" mb="md">
        Failed to load suppliers: {error.message}
      </Text>
      <Button variant="subtle" color="gray" onClick={reset}>
        Try again
      </Button>
    </Box>
  );
}
