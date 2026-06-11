import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCalendar, IconSearch } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";

import {
  cancelPublicAppointment,
  getAvailableSlots,
  getPublicAppointmentByReference,
  reschedulePublicAppointment,
  type AvailableSlot,
  type PublicAppointment,
} from "../api/public-booking.api";

type LookupFormValues = {
  bookingReference: string;
  email: string;
};

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

export default function ManageBookingPage() {
  const { bookingSlug } = useParams();

  const [lookupDetails, setLookupDetails] = useState<LookupFormValues | null>(
    null
  );
  const [appointment, setAppointment] = useState<PublicAppointment | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  const form = useForm<LookupFormValues>({
    initialValues: {
      bookingReference: "",
      email: "",
    },

    validate: {
      bookingReference: (value) =>
        value.trim().length < 3 ? "Booking reference is required" : null,
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : "Enter a valid email",
    },
  });

  const lookupMutation = useMutation({
    mutationFn: (values: LookupFormValues) => {
      if (!bookingSlug) {
        throw new Error("Missing booking slug");
      }

      return getPublicAppointmentByReference({
        bookingSlug,
        bookingReference: values.bookingReference.trim(),
        email: values.email.trim(),
      });
    },

    onSuccess: (data, values) => {
      setAppointment(data);
      setLookupDetails(values);
      setSelectedDate(null);
      setSelectedSlot(null);

      notifications.show({
        title: "Appointment found",
        message: "Your appointment details have been loaded.",
        color: "green",
      });
    },

    onError: () => {
      setAppointment(null);
      setLookupDetails(null);

      notifications.show({
        title: "Appointment not found",
        message: "Check your email and booking reference.",
        color: "red",
      });
    },
  });

  const availableSlotsQuery = useQuery({
    queryKey: [
      "manage-booking-slots",
      bookingSlug,
      appointment?.staffId,
      appointment?.serviceId,
      selectedDate,
    ],
    queryFn: () =>
      getAvailableSlots({
        bookingSlug: bookingSlug as string,
        staffId: appointment?.staffId as string,
        serviceId: appointment?.serviceId as string,
        date: selectedDate as string,
      }),
    enabled: Boolean(
      bookingSlug &&
        appointment?.staffId &&
        appointment?.serviceId &&
        selectedDate &&
        appointment.status === "CONFIRMED"
    ),
  });

  const cancelMutation = useMutation({
    mutationFn: () => {
      if (!bookingSlug || !lookupDetails || !appointment) {
        throw new Error("Missing cancellation details");
      }

      return cancelPublicAppointment({
        bookingSlug,
        bookingReference: appointment.bookingReference,
        email: lookupDetails.email,
      });
    },

    onSuccess: (data) => {
      setAppointment(data);

      notifications.show({
        title: "Appointment cancelled",
        message: "Your appointment has been cancelled successfully.",
        color: "green",
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

  const rescheduleMutation = useMutation({
    mutationFn: () => {
      if (!bookingSlug || !lookupDetails || !appointment || !selectedSlot) {
        throw new Error("Missing reschedule details");
      }

      return reschedulePublicAppointment({
        bookingSlug,
        bookingReference: appointment.bookingReference,
        email: lookupDetails.email,
        startDateTime: selectedSlot.startDateTime,
      });
    },

    onSuccess: (data) => {
      setAppointment(data);
      setSelectedDate(null);
      setSelectedSlot(null);

      notifications.show({
        title: "Appointment rescheduled",
        message: "Your appointment has been rescheduled successfully.",
        color: "green",
      });
    },

    onError: () => {
      notifications.show({
        title: "Could not reschedule appointment",
        message:
          "The selected slot may no longer be available. Please choose another time.",
        color: "red",
      });
    },
  });

  function handleLookup(values: LookupFormValues) {
    lookupMutation.mutate(values);
  }

  function handleCancel() {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmed) return;

    cancelMutation.mutate();
  }

  function handleDateChange(value: string | null) {
    setSelectedDate(value ? dayjs(value).format("YYYY-MM-DD") : null);
    setSelectedSlot(null);
  }

  function handleReschedule() {
    if (!selectedSlot) {
      notifications.show({
        title: "Select a time",
        message: "Choose a new available time before rescheduling.",
        color: "yellow",
      });

      return;
    }

    rescheduleMutation.mutate();
  }

  const slots = availableSlotsQuery.data?.slots ?? [];
  const canModifyAppointment = appointment?.status === "CONFIRMED";

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={2}>Manage Booking</Title>
          <Text c="dimmed" mt={4}>
            Enter your booking reference and email to view, cancel, or
            reschedule your appointment.
          </Text>
        </div>

        <Card withBorder radius="md" p="lg">
          <form onSubmit={form.onSubmit(handleLookup)}>
            <Stack>
              <TextInput
                label="Booking reference"
                placeholder="BK-A1B2C3D4"
                required
                {...form.getInputProps("bookingReference")}
              />

              <TextInput
                label="Email"
                placeholder="john@example.com"
                required
                {...form.getInputProps("email")}
              />

              <Button
                type="submit"
                leftSection={<IconSearch size={16} />}
                loading={lookupMutation.isPending}
              >
                Find Booking
              </Button>
            </Stack>
          </form>
        </Card>

        {lookupMutation.isPending && (
          <Group justify="center">
            <Loader />
          </Group>
        )}

        {appointment && (
          <Card withBorder radius="md" p="lg">
            <Stack>
              <Group justify="space-between">
                <div>
                  <Title order={3}>Appointment Details</Title>
                  <Text c="dimmed" size="sm">
                    Reference: {appointment.bookingReference}
                  </Text>
                </div>

                <Badge color={statusColor(appointment.status)} size="lg">
                  {appointment.status}
                </Badge>
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <Paper withBorder p="md" radius="md">
                  <Text size="sm" c="dimmed">
                    Customer
                  </Text>
                  <Text fw={600}>{appointment.customerName}</Text>
                  <Text size="sm">{appointment.customerEmail}</Text>
                  <Text size="sm">{appointment.customerPhone}</Text>
                </Paper>

                <Paper withBorder p="md" radius="md">
                  <Text size="sm" c="dimmed">
                    Service
                  </Text>
                  <Text fw={600}>
                    {appointment.service?.name ?? "Selected service"}
                  </Text>
                  <Text size="sm">
                    {appointment.service?.durationMinutes ?? ""} mins
                  </Text>
                </Paper>

                <Paper withBorder p="md" radius="md">
                  <Text size="sm" c="dimmed">
                    Staff
                  </Text>
                  <Text fw={600}>
                    {appointment.staff?.fullName ?? "Selected staff"}
                  </Text>
                </Paper>

                <Paper withBorder p="md" radius="md">
                  <Text size="sm" c="dimmed">
                    Date and time
                  </Text>
                  <Text fw={600}>
                    {dayjs(appointment.startDateTime).format("DD MMM YYYY")}
                  </Text>
                  <Text size="sm">
                    {dayjs(appointment.startDateTime).format("HH:mm")} -{" "}
                    {dayjs(appointment.endDateTime).format("HH:mm")}
                  </Text>
                </Paper>
              </SimpleGrid>

              {!canModifyAppointment && (
                <Alert
                  color="yellow"
                  icon={<IconAlertCircle size={16} />}
                  title="This booking cannot be modified"
                >
                  Only confirmed appointments can be cancelled or rescheduled.
                </Alert>
              )}

              {canModifyAppointment && (
                <Group justify="flex-end">
                  <Button
                    color="red"
                    variant="light"
                    onClick={handleCancel}
                    loading={cancelMutation.isPending}
                  >
                    Cancel Appointment
                  </Button>
                </Group>
              )}
            </Stack>
          </Card>
        )}

        {appointment && canModifyAppointment && (
          <Card withBorder radius="md" p="lg">
            <Stack>
              <Title order={3}>Reschedule Appointment</Title>
              <Text c="dimmed" size="sm">
                Choose a new date and available slot for the same staff and
                service.
              </Text>

              <DatePickerInput
                label="New date"
                placeholder="Select new date"
                value={selectedDate}
                onChange={handleDateChange}
                minDate={new Date().toISOString()}
                leftSection={<IconCalendar size={16} />}
                clearable
              />

              {selectedDate && availableSlotsQuery.isLoading && (
                <Group justify="center">
                  <Loader />
                </Group>
              )}

              {selectedDate &&
                !availableSlotsQuery.isLoading &&
                slots.length === 0 && (
                  <Alert color="yellow" icon={<IconAlertCircle size={16} />}>
                    No available slots for this date. Try another date.
                  </Alert>
                )}

              {slots.length > 0 && (
                <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }}>
                  {slots.map((slot) => (
                    <Button
                      key={slot.startDateTime}
                      variant={
                        selectedSlot?.startDateTime === slot.startDateTime
                          ? "filled"
                          : "light"
                      }
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot.startTime}
                    </Button>
                  ))}
                </SimpleGrid>
              )}

              <Group justify="flex-end">
                <Button
                  onClick={handleReschedule}
                  disabled={!selectedSlot}
                  loading={rescheduleMutation.isPending}
                >
                  Confirm Reschedule
                </Button>
              </Group>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
