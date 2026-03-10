import { Box, Skeleton, Stack, Grid, GridCol } from "@mantine/core";

export default function DashboardLoading() {
  return (
    <Box style={{ padding: "24px 16px" }} p={{ sm: "32px 40px" }}>
      <Stack gap="xs" mb="xl">
        <Skeleton height={26} width={200} radius="sm" />
        <Skeleton height={16} width={140} radius="sm" />
      </Stack>
      <Grid gutter="md">
        {[1, 2, 3].map((i) => (
          <GridCol key={i} span={{ base: 12, md: 6, xl: 4 }}>
            <Skeleton height={180} radius="md" />
          </GridCol>
        ))}
      </Grid>
    </Box>
  );
}
