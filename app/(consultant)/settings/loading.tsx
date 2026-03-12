import { Box, Skeleton, Stack } from "@mantine/core";

export default function SettingsLoading() {
  return (
    <Box style={{ padding: "32px 40px 40px" }}>
      <Stack gap="md">
        <Skeleton height={28} width={140} />
        <Skeleton height={16} width={220} />
        <Skeleton height={300} radius="md" />
      </Stack>
    </Box>
  );
}
