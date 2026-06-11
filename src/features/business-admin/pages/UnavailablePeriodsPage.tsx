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
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";

import { getStaff } from "../api/staff.api";
import {
  createUnavailablePeriod,
  deleteUnavailablePeriod,
  getUnavailablePeriods,
  updateUnavailablePeriod,
  type UnavailablePeriod,
} from "../api/unavailable-periods.api";

type UnavailablePeriodFormValues = {
  staffId: string;
  startDateTime: string | null;
  endDateTime: string | null;
  reason: string;
};

export default function UnavailablePeriodsPage() {
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);

  const [selectedPeriod, setSelectedPeriod] =
    useState<UnavailablePeriod | null>(null);

  const form = useForm<UnavailablePeriodFormValues>({
    initialValues: {
      staffId: "",
      startDateTime: null,
      endDateTime: null,
      reason: "",
    },

    validate: {
      staffId: (value) => (!value ? "Select a staff member" : null),

      startDateTime: (value) =>
        !value ? "Start date and time is required" : null,

      endDateTime: (value, values) => {
        if (!value) return "End date and time is required";

        if (values.startDateTime && value <= values.startDateTime) {
          return "End date and time must be after start date and time";
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
    data: unavailablePeriods,
    isLoading: isLoadingPeriods,
    isError: isPeriodsError,
  } = useQuery({
    queryKey: ["business-admin-unavailable-periods"],
    queryFn: getUnavailablePeriods,
  });

  const staffOptions =
    staff
      ?.filter((item) => item.isActive)
      .map((item) => ({
        value: item.id,
        label: item.fullName,
      })) ?? [];

  const createMutation = useMutation({
    mutationFn: createUnavailablePeriod,
    onSuccess: () => {
      notifications.show({
        title: "Unavailable period created",
        message: "The blocked time has been added successfully.",
        color: "green",
      });

      queryClient.invalidateQueries({
        queryKey: ["business-admin-unavailable-periods"],
      });

      handleCloseModal();
    },
    onError: () => {
      notifications.show({
        title: "Could not create unavailable period",
        message:
          "The selected time may overlap with an existing unavailable period.",
        color: "red",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      unavailablePeriodId,
      payload,
    }: {
      unavailablePeriodId: string;
      payload: {
        staffId?: string;
        startDateTime?: string;
        endDateTime?: string;
        reason?: string;
      };
    }) => updateUnavailablePeriod(unavailablePeriodId, payload),
    onSuccess: () => {
      notifications.show({
        title: "Unavailable period updated",
        message: "The blocked time has been updated successfully.",
        color: "green",
      });

      queryClient.invalidateQueries({
        queryKey: ["business-admin-unavailable-periods"],
      });

      handleCloseModal();
    },
    onError: () => {
      notifications.show({
        title: "Could not update unavailable period",
        message: "Please check the details and try again.",
        color: "red",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUnavailablePeriod,
    onSuccess: () => {
      notifications.show({
        title: "Unavailable period deleted",
        message: "The blocked time has been removed successfully.",
        color: "green",
      });

      queryClient.invalidateQueries({
        queryKey: ["business-admin-unavailable-periods"],
      });
    },
    onError: () => {
      notifications.show({
        title: "Could not delete unavailable period",
        message: "Please try again.",
        color: "red",
      });
    },
  });

  function handleOpenCreateModal() {
    setSelectedPeriod(null);
    form.reset();
    open();
  }

  function handleOpenEditModal(period: UnavailablePeriod) {
    setSelectedPeriod(period);

    form.setValues({
      staffId: period.staffId,
      startDateTime: period.startDateTime,
      endDateTime: period.endDateTime,
      reason: period.reason ?? "",
    });

    open();
  }

  function handleCloseModal() {
    setSelectedPeriod(null);
    form.reset();
    close();
  }

  function handleSubmit(values: UnavailablePeriodFormValues) {
    if (!values.startDateTime || !values.endDateTime) return;

    const payload = {
      staffId: values.staffId,
      startDateTime: new Date(values.startDateTime).toISOString(),
      endDateTime: new Date(values.endDateTime).toISOString(),
      reason: values.reason || undefined,
    };

    if (selectedPeriod) {
      updateMutation.mutate({
        unavailablePeriodId: selectedPeriod.id,
        payload,
      });

      return;
    }

    createMutation.mutate(payload);
  }

  function handleDelete(unavailablePeriodId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this unavailable period?"
    );

    if (!confirmed) return;

    deleteMutation.mutate(unavailablePeriodId);
  }

  const isLoading = isLoadingStaff || isLoadingPeriods;
  const isError = isStaffError || isPeriodsError;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>Unavailable Periods</Title>
            <Text c="dimmed" mt={4}>
              Block staff time for breaks, holidays, days off or unavailable
              periods.
            </Text>
          </div>

          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleOpenCreateModal}
          >
            Add Blocked Time
          </Button>
        </Group>

        <Card withBorder radius="md">
          {isLoading ? (
            <Group justify="center" py="xl">
              <Loader />
            </Group>
          ) : isError ? (
            <Text c="red">Could not load unavailable periods.</Text>
          ) : unavailablePeriods?.length === 0 ? (
            <Text c="dimmed">No unavailable periods have been added yet.</Text>
          ) : (
            <Table.ScrollContainer minWidth={950}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Staff</Table.Th>
                    <Table.Th>Start</Table.Th>
                    <Table.Th>End</Table.Th>
                    <Table.Th>Reason</Table.Th>
                    <Table.Th ta="right">Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {unavailablePeriods?.map((period) => (
                    <Table.Tr key={period.id}>
                      <Table.Td>
                        <Text fw={600}>
                          {period.staff?.fullName ?? "Unknown staff"}
                        </Text>
                      </Table.Td>

                      <Table.Td>
                        {dayjs(period.startDateTime).format(
                          "DD MMM YYYY, HH:mm"
                        )}
                      </Table.Td>

                      <Table.Td>
                        {dayjs(period.endDateTime).format("DD MMM YYYY, HH:mm")}
                      </Table.Td>

                      <Table.Td>{period.reason || "N/A"}</Table.Td>

                      <Table.Td>
                        <Group justify="flex-end" gap="xs">
                          <Tooltip label="Edit unavailable period">
                            <ActionIcon
                              variant="light"
                              onClick={() => handleOpenEditModal(period)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>

                          <Tooltip label="Delete unavailable period">
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleDelete(period.id)}
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
        title={selectedPeriod ? "Edit Blocked Time" : "Add Blocked Time"}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Staff member"
              placeholder="Select staff"
              data={staffOptions}
              value={form.values.staffId || null}
              onChange={(value) => form.setFieldValue("staffId", value ?? "")}
              searchable
              required
            />

            <DateTimePicker
              label="Start date and time"
              placeholder="Select start date and time"
              value={form.values.startDateTime}
              onChange={(value) => form.setFieldValue("startDateTime", value)}
              required
              clearable
            />

            <DateTimePicker
              label="End date and time"
              placeholder="Select end date and time"
              value={form.values.endDateTime}
              onChange={(value) => form.setFieldValue("endDateTime", value)}
              required
              clearable
            />

            <TextInput
              label="Reason"
              placeholder="Lunch break, holiday, day off..."
              {...form.getInputProps("reason")}
            />

            <Button type="submit" loading={isSubmitting}>
              {selectedPeriod ? "Save Changes" : "Create Blocked Time"}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
