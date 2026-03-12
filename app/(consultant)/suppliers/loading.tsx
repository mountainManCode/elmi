import { Box, Skeleton, Stack } from "@mantine/core";

export default function SuppliersLoading() {
  return (
    <Box style={{ padding: "32px 40px 40px" }}>
      <Stack gap="md">
        <Skeleton height={28} width={160} />
        <Skeleton height={16} width={240} />
        <Skeleton height={400} radius="md" />
      </Stack>
    </Box>
  );
}
