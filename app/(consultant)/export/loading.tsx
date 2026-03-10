import { Box, Skeleton, Stack } from "@mantine/core";

export default function ExportLoading() {
  return (
    <Box style={{ padding: "24px 16px" }} p={{ sm: "32px 40px" }}>
      <Stack gap="xs" mb="xl">
        <Skeleton height={26} width={180} radius="sm" />
        <Skeleton height={16} width={120} radius="sm" />
      </Stack>
      <Skeleton height={320} radius="md" />
    </Box>
  );
}
