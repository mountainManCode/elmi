"use client";
import { Box, Button, Text } from "@mantine/core";
export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <Box style={{ padding: "80px 24px", textAlign: "center" }}>
      <Text c="dimmed" size="sm" mb="sm">Something went wrong loading the dashboard.</Text>
      <Button size="xs" variant="light" onClick={reset}>Try again</Button>
    </Box>
  );
}
