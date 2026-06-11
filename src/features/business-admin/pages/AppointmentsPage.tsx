import { useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
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
  Title,
  Tooltip,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import {
  IconCalendarTime,
  IconCircleCheck,
  IconCircleX,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";

import { getStaff } from "../api/staff.api";
import { getServices } from "../api/services.api";
import {
  cancelAppointment,
  completeAppointment,
  getAppointments,
  rescheduleAppointment,
  type Appointment,
  type AppointmentStatus,
} from "../api/appointments.api";

const appointmentStatusOptions = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "COMPLETED", label: "Completed" },
];

function statusColor(status: AppointmentStatus) {
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

type RescheduleFormValues = {
  staffId: string;
  serviceId: string;
  startDateTime: string | null;
};

export default function AppointmentsPage() {
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState<string | null>("");
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string | null>(
    null
  );
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<
    string | null
  >(null);

  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm<RescheduleFormValues>({
    initialValues: {
      staffId: "",
      serviceId: "",
      startDateTime: null,
    },

    validate: {
      staffId: (value) => (!value ? "Select staff" : null),
      serviceId: (value) => (!value ? "Select service" : null),
      startDateTime: (value) =>
        !value ? "Select new appointment date and time" : null,
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
    data: services,
    isLoading: isLoadingServices,
    isError: isServicesError,
  } = useQuery({
    queryKey: ["business-admin-services"],
    queryFn: getServices,
  });

  const query = useMemo(() => {
    return {
      status: selectedStatus
        ? (selectedStatus as AppointmentStatus)
        : undefined,
      staffId: selectedStaffFilter || undefined,
      serviceId: selectedServiceFilter || undefined,
    };
  }, [selectedStatus, selectedStaffFilter, selectedServiceFilter]);

  const {
    data: appointments,
    isLoading: isLoadingAppointments,
    isError: isAppointmentsError,
  } = useQuery({
    queryKey: ["business-admin-appointments", query],
    queryFn: () => getAppointments(query),
  });

  const staffOptions =
    staff?.map((item) => ({
      value: item.id,
      label: item.fullName,
    })) ?? [];

  const serviceOptions =
    services?.map((item) => ({
      value: item.id,
      label: item.name,
    })) ?? [];

  const cancelMutation = useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => {
      notifications.show({
        title: "Appointment cancelled",
        message: "The appointment has been cancelled successfully.",
        color: "green",
      });

      queryClient.invalidateQueries({
        queryKey: ["business-admin-appointments"],
      });

      queryClient.invalidateQueries({
        queryKey: ["business-admin-dashboard"],
      });
    },
    onError: () => {
      notifications.show({
        title: "Could not cancel appointment",
        message: "This appointment may already be cancelled or completed.",
        color: "red",
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeAppointment,
    onSuccess: () => {
      notifications.show({
        title: "Appointment completed",
        message: "The appointment has been marked as completed.",
        color: "green",
      });

      queryClient.invalidateQueries({
        queryKey: ["business-admin-appointments"],
      });

      queryClient.invalidateQueries({
        queryKey: ["business-admin-dashboard"],
      });
    },
    onError: () => {
      notifications.show({
        title: "Could not complete appointment",
        message: "This appointment may already be cancelled or completed.",
        color: "red",
      });
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({
      appointmentId,
      payload,
    }: {
      appointmentId: string;
      payload: {
        staffId?: string;
        serviceId?: string;
        startDateTime: string;
      };
    }) => rescheduleAppointment(appointmentId, payload),
    onSuccess: () => {
      notifications.show({
        title: "Appointment rescheduled",
        message: "The appointment has been rescheduled successfully.",
        color: "green",
      });

      queryClient.invalidateQueries({
        queryKey: ["business-admin-appointments"],
      });

      queryClient.invalidateQueries({
        queryKey: ["business-admin-dashboard"],
      });

      handleCloseModal();
    },
    onError: () => {
      notifications.show({
        title: "Could not reschedule appointment",
        message:
          "The selected time may be outside availability or already booked.",
        color: "red",
      });
    },
  });

  function handleCancel(appointment: Appointment) {
    const confirmed = window.confirm(
      `Cancel appointment ${appointment.bookingReference}?`
    );

    if (!confirmed) return;

    cancelMutation.mutate(appointment.id);
  }

  function handleComplete(appointment: Appointment) {
    const confirmed = window.confirm(
      `Mark appointment ${appointment.bookingReference} as completed?`
    );

    if (!confirmed) return;

    completeMutation.mutate(appointment.id);
  }

  function handleOpenRescheduleModal(appointment: Appointment) {
    setSelectedAppointment(appointment);

    form.setValues({
      staffId: appointment.staffId,
      serviceId: appointment.serviceId,
      startDateTime: appointment.startDateTime,
    });

    open();
  }

  function handleCloseModal() {
    setSelectedAppointment(null);
    form.reset();
    close();
  }

  function handleRescheduleSubmit(values: RescheduleFormValues) {
    if (!selectedAppointment || !values.startDateTime) return;

    rescheduleMutation.mutate({
      appointmentId: selectedAppointment.id,
      payload: {
        staffId: values.staffId,
        serviceId: values.serviceId,
        startDateTime: new Date(values.startDateTime).toISOString(),
      },
    });
  }

  const isLoading =
    isLoadingAppointments || isLoadingStaff || isLoadingServices;

  const isError = isAppointmentsError || isStaffError || isServicesError;

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={2}>Appointments</Title>
          <Text c="dimmed" mt={4}>
            View, cancel, complete and reschedule customer appointments.
          </Text>
        </div>

        <Card withBorder radius="md">
          <Stack>
            <Group grow>
              <Select
                label="Status"
                placeholder="Filter by status"
                data={appointmentStatusOptions}
                value={selectedStatus}
                onChange={(value) => setSelectedStatus(value)}
                clearable
              />

              <Select
                label="Staff"
                placeholder="Filter by staff"
                data={staffOptions}
                value={selectedStaffFilter}
                onChange={(value) => setSelectedStaffFilter(value)}
                searchable
                clearable
              />

              <Select
                label="Service"
                placeholder="Filter by service"
                data={serviceOptions}
                value={selectedServiceFilter}
                onChange={(value) => setSelectedServiceFilter(value)}
                searchable
                clearable
              />
            </Group>
          </Stack>
        </Card>

        <Card withBorder radius="md">
          {isLoading ? (
            <Group justify="center" py="xl">
              <Loader />
            </Group>
          ) : isError ? (
            <Text c="red">Could not load appointments.</Text>
          ) : appointments?.length === 0 ? (
            <Text c="dimmed">No appointments found.</Text>
          ) : (
            <Table.ScrollContainer minWidth={1100}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Customer</Table.Th>
                    <Table.Th>Service</Table.Th>
                    <Table.Th>Staff</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Reference</Table.Th>
                    <Table.Th ta="right">Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {appointments?.map((appointment) => {
                    const isFinal =
                      appointment.status === "CANCELLED" ||
                      appointment.status === "COMPLETED";

                    return (
                      <Table.Tr key={appointment.id}>
                        <Table.Td>
                          <Text fw={600}>{appointment.customerName}</Text>
                          <Text size="xs" c="dimmed">
                            {appointment.customerEmail}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {appointment.customerPhone}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          {appointment.service?.name ?? "Unknown service"}
                        </Table.Td>

                        <Table.Td>
                          {appointment.staff?.fullName ?? "Unknown staff"}
                        </Table.Td>

                        <Table.Td>
                          <Text>
                            {dayjs(appointment.startDateTime).format(
                              "DD MMM YYYY"
                            )}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {dayjs(appointment.startDateTime).format("HH:mm")} -{" "}
                            {dayjs(appointment.endDateTime).format("HH:mm")}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Badge color={statusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </Table.Td>

                        <Table.Td>{appointment.bookingReference}</Table.Td>

                        <Table.Td>
                          <Group justify="flex-end" gap="xs">
                            <Tooltip label="Reschedule">
                              <ActionIcon
                                variant="light"
                                onClick={() =>
                                  handleOpenRescheduleModal(appointment)
                                }
                                disabled={isFinal}
                              >
                                <IconCalendarTime size={16} />
                              </ActionIcon>
                            </Tooltip>

                            <Tooltip label="Complete">
                              <ActionIcon
                                variant="light"
                                color="green"
                                onClick={() => handleComplete(appointment)}
                                disabled={isFinal}
                                loading={completeMutation.isPending}
                              >
                                <IconCircleCheck size={16} />
                              </ActionIcon>
                            </Tooltip>

                            <Tooltip label="Cancel">
                              <ActionIcon
                                variant="light"
                                color="red"
                                onClick={() => handleCancel(appointment)}
                                disabled={isFinal}
                                loading={cancelMutation.isPending}
                              >
                                <IconCircleX size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Card>
      </Stack>

      <Modal
        opened={opened}
        onClose={handleCloseModal}
        title="Reschedule Appointment"
        centered
      >
        <form onSubmit={form.onSubmit(handleRescheduleSubmit)}>
          <Stack>
            <Select
              label="Staff"
              placeholder="Select staff"
              data={staffOptions}
              value={form.values.staffId || null}
              onChange={(value) => form.setFieldValue("staffId", value ?? "")}
              searchable
              required
            />

            <Select
              label="Service"
              placeholder="Select service"
              data={serviceOptions}
              value={form.values.serviceId || null}
              onChange={(value) => form.setFieldValue("serviceId", value ?? "")}
              searchable
              required
            />

            <DateTimePicker
              label="New date and time"
              placeholder="Select new appointment time"
              value={form.values.startDateTime}
              onChange={(value) => form.setFieldValue("startDateTime", value)}
              required
              clearable
            />

            <Button type="submit" loading={rescheduleMutation.isPending}>
              Reschedule Appointment
            </Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
