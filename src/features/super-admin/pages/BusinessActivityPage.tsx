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
import { useParams } from "react-router-dom";
import dayjs from "dayjs";

import { getBusinessActivity } from "../api/super-admin.api";

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

export default function BusinessActivityPage() {
  const { businessId } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["business-activity", businessId],
    queryFn: () => getBusinessActivity(businessId as string),
    enabled: Boolean(businessId),
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
        <Title order={2}>Business Activity</Title>
        <Text c="red" mt="md">
          Could not load business activity.
        </Text>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Group>
            <Title order={2}>{data.business.name}</Title>
            <Badge color={data.business.status === "ACTIVE" ? "green" : "gray"}>
              {data.business.status}
            </Badge>
          </Group>

          <Text c="dimmed" mt={4}>
            Activity overview for /book/{data.business.bookingSlug}
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          <StatCard
            title="Staff"
            value={data.staff.total}
            subtitle={`${data.staff.active} active, ${data.staff.inactive} inactive`}
          />
          <StatCard
            title="Services"
            value={data.services.total}
            subtitle={`${data.services.active} active, ${data.services.inactive} inactive`}
          />
          <StatCard
            title="Appointments"
            value={data.appointments.total}
            subtitle={`${data.appointments.confirmed} confirmed`}
          />
          <StatCard
            title="Business Admins"
            value={data.businessAdmins.length}
          />
        </SimpleGrid>

        <Card withBorder radius="md">
          <Title order={4}>Business Admins</Title>
          <Text size="sm" c="dimmed" mb="md">
            Admin users assigned to this business.
          </Text>

          {data.businessAdmins.length === 0 ? (
            <Text c="dimmed">No Business Admin has been assigned yet.</Text>
          ) : (
            <Table.ScrollContainer minWidth={700}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Created</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {data.businessAdmins.map((admin) => (
                    <Table.Tr key={admin.id}>
                      <Table.Td>
                        <Text fw={600}>{admin.fullName}</Text>
                      </Table.Td>
                      <Table.Td>{admin.email}</Table.Td>
                      <Table.Td>
                        <Badge color={admin.isActive ? "green" : "gray"}>
                          {admin.isActive ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {dayjs(admin.createdAt).format("DD MMM YYYY")}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Card>

        <Card withBorder radius="md">
          <Title order={4}>Recent Appointments</Title>
          <Text size="sm" c="dimmed" mb="md">
            Latest appointments for this business.
          </Text>

          {data.recentAppointments.length === 0 ? (
            <Text c="dimmed">No appointments yet.</Text>
          ) : (
            <Table.ScrollContainer minWidth={900}>
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
