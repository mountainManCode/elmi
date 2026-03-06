import { Container, Text } from "@mantine/core";

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Container size="sm" py="xl">
      <Text size="sm" c="dimmed" mb="lg">
        Elmi — Document Upload Portal
      </Text>
      {children}
    </Container>
  );
}
