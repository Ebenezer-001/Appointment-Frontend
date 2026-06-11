import { useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconLink, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getStaff } from "../api/staff.api";
import { getServices } from "../api/services.api";
import {
  assignServiceToStaff,
  getServicesForStaff,
  removeServiceFromStaff,
} from "../api/staff-services.api";

export default function StaffServiceAssignmentPage() {
  const queryClient = useQueryClient();

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );

  const {
    data: staff,
    isLoading: isLoadingStaff,
    isError: isStaffError,
  } = useQuery({
    queryKey: ["business-admin-staff"],
    queryFn: getStaff,
  });

  const {
    data: services,
    isLoading: isLoadingServices,
    isError: isServicesError,
  } = useQuery({
    queryKey: ["business-admin-services"],
    queryFn: getServices,
  });

  const {
    data: assignedServices,
    isLoading: isLoadingAssignedServices,
    isError: isAssignedServicesError,
  } = useQuery({
    queryKey: ["staff-services", selectedStaffId],
    queryFn: () => getServicesForStaff(selectedStaffId as string),
    enabled: Boolean(selectedStaffId),
  });

  const activeStaffOptions = useMemo(() => {
    return (
      staff
        ?.filter((item) => item.isActive)
        .map((item) => ({
          value: item.id,
          label: item.fullName,
        })) ?? []
    );
  }, [staff]);

  const activeServiceOptions = useMemo(() => {
    return (
      services
        ?.filter((item) => item.isActive)
        .map((item) => ({
          value: item.id,
          label: `${item.name} - ${item.durationMinutes} mins`,
        })) ?? []
    );
  }, [services]);

  const assignMutation = useMutation({
    mutationFn: assignServiceToStaff,
    onSuccess: () => {
      notifications.show({
        title: "Service assigned",
        message: "The service has been assigned to the staff member.",
        color: "green",
      });

      setSelectedServiceId(null);

      queryClient.invalidateQueries({
        queryKey: ["staff-services", selectedStaffId],
      });
    },
    onError: () => {
      notifications.show({
        title: "Could not assign service",
        message:
          "This service may already be assigned, or the selected records are invalid.",
        color: "red",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({
      staffId,
      serviceId,
    }: {
      staffId: string;
      serviceId: string;
    }) => removeServiceFromStaff(staffId, serviceId),
    onSuccess: () => {
      notifications.show({
        title: "Service removed",
        message: "The service has been removed from the staff member.",
        color: "green",
      });

      queryClient.invalidateQueries({
        queryKey: ["staff-services", selectedStaffId],
      });
    },
    onError: () => {
      notifications.show({
        title: "Could not remove service",
        message: "Please try again.",
        color: "red",
      });
    },
  });

  function handleAssign() {
    if (!selectedStaffId || !selectedServiceId) {
      notifications.show({
        title: "Missing selection",
        message: "Select both a staff member and a service.",
        color: "yellow",
      });

      return;
    }

    assignMutation.mutate({
      staffId: selectedStaffId,
      serviceId: selectedServiceId,
    });
  }

  function handleRemove(serviceId: string) {
    if (!selectedStaffId) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove this service from the staff member?"
    );

    if (!confirmed) return;

    removeMutation.mutate({
      staffId: selectedStaffId,
      serviceId,
    });
  }

  const isPageLoading = isLoadingStaff || isLoadingServices;
  const hasPageError = isStaffError || isServicesError;

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={2}>Assign Services to Staff</Title>
          <Text c="dimmed" mt={4}>
            Control which staff members can provide each service.
          </Text>
        </div>

        <Card withBorder radius="md">
          {isPageLoading ? (
            <Group justify="center" py="xl">
              <Loader />
            </Group>
          ) : hasPageError ? (
            <Text c="red">Could not load staff or services.</Text>
          ) : (
            <Stack>
              <SimpleGrid cols={{ base: 1, md: 2 }}>
                <Select
                  label="Staff member"
                  placeholder="Select staff"
                  data={activeStaffOptions}
                  value={selectedStaffId}
                  onChange={(value) => {
                    setSelectedStaffId(value);
                    setSelectedServiceId(null);
                  }}
                  searchable
                  clearable
                />

                <Select
                  label="Service"
                  placeholder="Select service"
                  data={activeServiceOptions}
                  value={selectedServiceId}
                  onChange={(value) => setSelectedServiceId(value)}
                  searchable
                  clearable
                  disabled={!selectedStaffId}
                />
              </SimpleGrid>

              <Group justify="flex-end">
                <Button
                  leftSection={<IconLink size={16} />}
                  onClick={handleAssign}
                  loading={assignMutation.isPending}
                  disabled={!selectedStaffId || !selectedServiceId}
                >
                  Assign Service
                </Button>
              </Group>
            </Stack>
          )}
        </Card>

        <Card withBorder radius="md">
          <Group justify="space-between" mb="md">
            <div>
              <Title order={4}>Assigned Services</Title>
              <Text size="sm" c="dimmed">
                Services currently assigned to the selected staff member.
              </Text>
            </div>
          </Group>

          {!selectedStaffId ? (
            <Text c="dimmed">Select a staff member to view assignments.</Text>
          ) : isLoadingAssignedServices ? (
            <Group justify="center" py="xl">
              <Loader />
            </Group>
          ) : isAssignedServicesError ? (
            <Text c="red">Could not load assigned services.</Text>
          ) : assignedServices?.length === 0 ? (
            <Text c="dimmed">
              No services have been assigned to this staff member yet.
            </Text>
          ) : (
            <Table.ScrollContainer minWidth={700}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Service</Table.Th>
                    <Table.Th>Duration</Table.Th>
                    <Table.Th>Price</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th ta="right">Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {assignedServices?.map((assignment) => (
                    <Table.Tr key={assignment.id}>
                      <Table.Td>
                        <Text fw={600}>
                          {assignment.service?.name ?? "Unknown service"}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {assignment.service?.description ?? "No description"}
                        </Text>
                      </Table.Td>

                      <Table.Td>
                        {assignment.service?.durationMinutes ?? 0} mins
                      </Table.Td>

                      <Table.Td>
                        £{Number(assignment.service?.price ?? 0).toFixed(2)}
                      </Table.Td>

                      <Table.Td>
                        <Badge
                          color={
                            assignment.service?.isActive ? "green" : "gray"
                          }
                        >
                          {assignment.service?.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </Table.Td>

                      <Table.Td>
                        <Group justify="flex-end">
                          <Tooltip label="Remove service">
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleRemove(assignment.serviceId)}
                              loading={removeMutation.isPending}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
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
