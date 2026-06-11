import { useState } from "react";
import {
  ActionIcon,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getStaff } from "../api/staff.api";
import {
  createAvailability,
  deleteAvailability,
  getAvailability,
  updateAvailability,
  type Availability,
} from "../api/availability.api";

const daysOfWeek = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

function getDayName(dayOfWeek: number) {
  return (
    daysOfWeek.find((day) => day.value === String(dayOfWeek))?.label ??
    "Unknown"
  );
}

type AvailabilityFormValues = {
  staffId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

export default function AvailabilityPage() {
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedAvailability, setSelectedAvailability] =
    useState<Availability | null>(null);

  const form = useForm<AvailabilityFormValues>({
    initialValues: {
      staffId: "",
      dayOfWeek: "",
      startTime: "09:00",
      endTime: "17:00",
    },

    validate: {
      staffId: (value) => (!value ? "Select a staff member" : null),
      dayOfWeek: (value) => (!value ? "Select a day" : null),
      startTime: (value) => (!value ? "Start time is required" : null),
      endTime: (value, values) => {
        if (!value) return "End time is required";
        if (values.startTime >= value) {
          return "End time must be after start time";
        }
        return null;
      },
    },
  });

  const {
    data: staff,
    isLoading: isLoadingStaff,
    isError: isStaffError,
  } = useQuery({
    queryKey: ["business-admin-staff"],
    queryFn: getStaff,
  });

  const {
    data: availability,
    isLoading: isLoadingAvailability,
    isError: isAvailabilityError,
  } = useQuery({
    queryKey: ["business-admin-availability"],
    queryFn: getAvailability,
  });

  const staffOptions =
    staff
      ?.filter((item) => item.isActive)
      .map((item) => ({
        value: item.id,
        label: item.fullName,
      })) ?? [];

  const createMutation = useMutation({
    mutationFn: createAvailability,
    onSuccess: () => {
      notifications.show({
        title: "Availability created",
        message: "Working hours have been added successfully.",
        color: "green",
      });

      queryClient.invalidateQueries({
        queryKey: ["business-admin-availability"],
      });

      handleCloseModal();
    },
    onError: () => {
      notifications.show({
        title: "Could not create availability",
        message:
          "This staff member may already have availability for the selected day.",
        color: "red",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      availabilityId,
      payload,
    }: {
      availabilityId: string;
      payload: {
        staffId?: string;
        dayOfWeek?: number;
        startTime?: string;
        endTime?: string;
      };
    }) => updateAvailability(availabilityId, payload),
    onSuccess: () => {
      notifications.show({
        title: "Availability updated",
        message: "Working hours have been updated successfully.",
        color: "green",
      });

      queryClient.invalidateQueries({
        queryKey: ["business-admin-availability"],
      });

      handleCloseModal();
    },
    onError: () => {
      notifications.show({
        title: "Could not update availability",
        message: "Please check the details and try again.",
        color: "red",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAvailability,
    onSuccess: () => {
      notifications.show({
        title: "Availability deleted",
        message: "Working hours have been removed successfully.",
        color: "green",
      });

      queryClient.invalidateQueries({
        queryKey: ["business-admin-availability"],
      });
    },
    onError: () => {
      notifications.show({
        title: "Could not delete availability",
        message: "Please try again.",
        color: "red",
      });
    },
  });

  function handleOpenCreateModal() {
    setSelectedAvailability(null);
    form.reset();
    open();
  }

  function handleOpenEditModal(item: Availability) {
    setSelectedAvailability(item);

    form.setValues({
      staffId: item.staffId,
      dayOfWeek: String(item.dayOfWeek),
      startTime: item.startTime.slice(0, 5),
      endTime: item.endTime.slice(0, 5),
    });

    open();
  }

  function handleCloseModal() {
    setSelectedAvailability(null);
    form.reset();
    close();
  }

  function handleSubmit(values: AvailabilityFormValues) {
    const payload = {
      staffId: values.staffId,
      dayOfWeek: Number(values.dayOfWeek),
      startTime: values.startTime,
      endTime: values.endTime,
    };

    if (selectedAvailability) {
      updateMutation.mutate({
        availabilityId: selectedAvailability.id,
        payload,
      });

      return;
    }

    createMutation.mutate(payload);
  }

  function handleDelete(availabilityId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this availability record?"
    );

    if (!confirmed) return;

    deleteMutation.mutate(availabilityId);
  }

  const isLoading = isLoadingStaff || isLoadingAvailability;
  const isError = isStaffError || isAvailabilityError;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>Availability</Title>
            <Text c="dimmed" mt={4}>
              Define weekly working hours for each staff member.
            </Text>
          </div>

          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleOpenCreateModal}
          >
            Add Availability
          </Button>
        </Group>

        <Card withBorder radius="md">
          {isLoading ? (
            <Group justify="center" py="xl">
              <Loader />
            </Group>
          ) : isError ? (
            <Text c="red">Could not load availability records.</Text>
          ) : availability?.length === 0 ? (
            <Text c="dimmed">No availability has been added yet.</Text>
          ) : (
            <Table.ScrollContainer minWidth={900}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Staff</Table.Th>
                    <Table.Th>Day</Table.Th>
                    <Table.Th>Start</Table.Th>
                    <Table.Th>End</Table.Th>
                    <Table.Th ta="right">Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {availability?.map((item) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        <Text fw={600}>
                          {item.staff?.fullName ?? "Unknown staff"}
                        </Text>
                      </Table.Td>

                      <Table.Td>{getDayName(item.dayOfWeek)}</Table.Td>
                      <Table.Td>{item.startTime.slice(0, 5)}</Table.Td>
                      <Table.Td>{item.endTime.slice(0, 5)}</Table.Td>

                      <Table.Td>
                        <Group justify="flex-end" gap="xs">
                          <Tooltip label="Edit availability">
                            <ActionIcon
                              variant="light"
                              onClick={() => handleOpenEditModal(item)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>

                          <Tooltip label="Delete availability">
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleDelete(item.id)}
                              loading={deleteMutation.isPending}
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

      <Modal
        opened={opened}
        onClose={handleCloseModal}
        title={selectedAvailability ? "Edit Availability" : "Add Availability"}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Staff member"
              placeholder="Select staff"
              data={staffOptions}
              searchable
              required
              {...form.getInputProps("staffId")}
            />

            <Select
              label="Day of week"
              placeholder="Select day"
              data={daysOfWeek}
              required
              {...form.getInputProps("dayOfWeek")}
            />

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TimeInput
                label="Start time"
                required
                {...form.getInputProps("startTime")}
              />

              <TimeInput
                label="End time"
                required
                {...form.getInputProps("endTime")}
              />
            </SimpleGrid>

            <Button type="submit" loading={isSubmitting}>
              {selectedAvailability ? "Save Changes" : "Create Availability"}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
