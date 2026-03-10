import { Box, Skeleton } from "@mantine/core";
export default function VerificationLoading() {
  return (
    <Box style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Skeleton height={56} radius={0} />
      <Box style={{ display: "flex", flex: 1 }}>
        <Skeleton height="100%" style={{ flex: "0 0 58%" }} radius={0} />
        <Box style={{ flex: 1, padding: 24 }}>
          <Skeleton height={20} mb="sm" />
          <Skeleton height={20} mb="sm" width="70%" />
          <Skeleton height={20} mb="xl" width="85%" />
          <Skeleton height={20} mb="sm" />
          <Skeleton height={20} mb="sm" width="60%" />
        </Box>
      </Box>
    </Box>
  );
}
