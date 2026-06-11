import {
  Card,
  Container,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

import { getSuperAdminDashboard } from "../api/super-admin.api";

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle?: string;
}) {
  return (
    <Card withBorder radius="md" p="lg">
      <Text size="sm" c="dimmed">
        {title}
      </Text>

      <Title order={2} mt={6}>
        {value}
      </Title>

      {subtitle && (
        <Text size="xs" c="dimmed" mt={4}>
          {subtitle}
        </Text>
      )}
    </Card>
  );
}

export default function SuperAdminDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["super-admin-dashboard"],
    queryFn: getSuperAdminDashboard,
  });

  if (isLoading) {
    return (
      <Container size="lg" py="xl">
        <Group justify="center">
          <Loader />
        </Group>
      </Container>
    );
  }

  if (isError || !data) {
    return (
      <Container size="lg" py="xl">
        <Title order={2}>Super Admin Dashboard</Title>
        <Text c="red" mt="md">
          Could not load dashboard data.
        </Text>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={2}>Super Admin Dashboard</Title>
          <Text c="dimmed" mt={4}>
            Platform-wide overview of businesses, business admins and
            appointments.
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          <StatCard
            title="Total Businesses"
            value={data.businesses.total}
            subtitle={`${data.businesses.active} active, ${data.businesses.inactive} inactive`}
          />

          <StatCard
            title="Business Admins"
            value={data.businessAdmins.total}
            subtitle={`${data.businessAdmins.active} active, ${data.businessAdmins.inactive} inactive`}
          />

          <StatCard
            title="Total Appointments"
            value={data.appointments.total}
            subtitle={`${data.appointments.confirmed} confirmed`}
          />

          <StatCard
            title="Completed Appointments"
            value={data.appointments.completed}
            subtitle={`${data.appointments.cancelled} cancelled`}
          />
        </SimpleGrid>

        <Card withBorder radius="md">
          <Title order={4}>Recent Businesses</Title>
          <Text size="sm" c="dimmed" mb="md">
            Latest businesses created on the platform.
          </Text>

          {data.recentBusinesses.length === 0 ? (
            <Text c="dimmed">No businesses yet.</Text>
          ) : (
            <Table.ScrollContainer minWidth={800}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Slug</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Created</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {data.recentBusinesses.map((business) => (
                    <Table.Tr key={business.id}>
                      <Table.Td>
                        <Text fw={600}>{business.name}</Text>
                      </Table.Td>
                      <Table.Td>{business.bookingSlug}</Table.Td>
                      <Table.Td>{business.status}</Table.Td>
                      <Table.Td>
                        {dayjs(business.createdAt).format("DD MMM YYYY")}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Card>
      </Stack>
    </Container>
  );
}
