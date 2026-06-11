import {
  Badge,
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

import { getBusinessAdminDashboard } from "../api/business-admin-dashboard.api";

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

function statusColor(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "green";
    case "PENDING":
      return "yellow";
    case "CANCELLED":
      return "red";
    case "COMPLETED":
      return "blue";
    default:
      return "gray";
  }
}

export default function BusinessAdminDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["business-admin-dashboard"],
    queryFn: getBusinessAdminDashboard,
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
        <Title order={2}>Business Dashboard</Title>
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
          <Title order={2}>Business Dashboard</Title>
          <Text c="dimmed" mt={4}>
            Overview of your staff, services and appointments.
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          <StatCard
            title="Total Staff"
            value={data.staff.total}
            subtitle={`${data.staff.active} active, ${data.staff.inactive} inactive`}
          />
          <StatCard
            title="Total Services"
            value={data.services.total}
            subtitle={`${data.services.active} active, ${data.services.inactive} inactive`}
          />
          <StatCard
            title="Total Appointments"
            value={data.appointments.total}
            subtitle={`${data.appointments.confirmed} confirmed`}
          />
          <StatCard
            title="Today's Appointments"
            value={data.appointments.today}
            subtitle={`${data.appointments.upcoming} upcoming`}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          <StatCard title="Pending" value={data.appointments.pending} />
          <StatCard title="Confirmed" value={data.appointments.confirmed} />
          <StatCard title="Cancelled" value={data.appointments.cancelled} />
          <StatCard title="Completed" value={data.appointments.completed} />
        </SimpleGrid>

        <Card withBorder radius="md">
          <Group justify="space-between" mb="md">
            <div>
              <Title order={4}>Recent Appointments</Title>
              <Text size="sm" c="dimmed">
                Latest appointments created for your business.
              </Text>
            </div>
          </Group>

          {data.recentAppointments.length === 0 ? (
            <Text c="dimmed">No appointments yet.</Text>
          ) : (
            <Table.ScrollContainer minWidth={800}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Customer</Table.Th>
                    <Table.Th>Service</Table.Th>
                    <Table.Th>Staff</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Reference</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {data.recentAppointments.map((appointment) => (
                    <Table.Tr key={appointment.id}>
                      <Table.Td>
                        <Text fw={600}>{appointment.customerName}</Text>
                        <Text size="xs" c="dimmed">
                          {appointment.customerEmail}
                        </Text>
                      </Table.Td>

                      <Table.Td>{appointment.service?.name ?? "N/A"}</Table.Td>

                      <Table.Td>
                        {appointment.staff?.fullName ?? "N/A"}
                      </Table.Td>

                      <Table.Td>
                        {dayjs(appointment.startDateTime).format(
                          "DD MMM YYYY, HH:mm"
                        )}
                      </Table.Td>

                      <Table.Td>
                        <Badge color={statusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </Table.Td>

                      <Table.Td>{appointment.bookingReference}</Table.Td>
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
