import { useMemo, useState } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Stepper,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCalendar, IconCheck, IconInfoCircle } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";

import {
  createPublicAppointment,
  getAvailableSlots,
  getPublicBusiness,
  getPublicServices,
  getPublicStaff,
  type AvailableSlot,
  type PublicService,
  type PublicStaff,
} from "../api/public-booking.api";

type CustomerFormValues = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};

export default function PublicBookingPage() {
  const { bookingSlug } = useParams();

  const [activeStep, setActiveStep] = useState(0);
  const [selectedService, setSelectedService] = useState<PublicService | null>(
    null
  );
  const [selectedStaff, setSelectedStaff] = useState<PublicStaff | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [confirmedReference, setConfirmedReference] = useState<string | null>(
    null
  );

  const form = useForm<CustomerFormValues>({
    initialValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
    },

    validate: {
      customerName: (value) =>
        value.trim().length < 2 ? "Name is required" : null,
      customerEmail: (value) =>
        /^\S+@\S+$/.test(value) ? null : "Enter a valid email",
      customerPhone: (value) =>
        value.trim().length < 5 ? "Phone number is required" : null,
    },
  });

  const businessQuery = useQuery({
    queryKey: ["public-business", bookingSlug],
    queryFn: () => getPublicBusiness(bookingSlug as string),
    enabled: Boolean(bookingSlug),
  });

  const servicesQuery = useQuery({
    queryKey: ["public-services", bookingSlug],
    queryFn: () => getPublicServices(bookingSlug as string),
    enabled: Boolean(bookingSlug),
  });

  const staffQuery = useQuery({
    queryKey: ["public-staff", bookingSlug, selectedService?.id],
    queryFn: () => getPublicStaff(bookingSlug as string, selectedService?.id),
    enabled: Boolean(bookingSlug && selectedService),
  });

  const availableSlotsQuery = useQuery({
    queryKey: [
      "available-slots",
      bookingSlug,
      selectedStaff?.id,
      selectedService?.id,
      selectedDate,
    ],
    queryFn: () =>
      getAvailableSlots({
        bookingSlug: bookingSlug as string,
        staffId: selectedStaff?.id as string,
        serviceId: selectedService?.id as string,
        date: selectedDate as string,
      }),
    enabled: Boolean(
      bookingSlug && selectedStaff && selectedService && selectedDate
    ),
  });

  const createAppointmentMutation = useMutation({
    mutationFn: (values: CustomerFormValues) => {
      if (!bookingSlug || !selectedStaff || !selectedService || !selectedSlot) {
        throw new Error("Missing booking details");
      }

      return createPublicAppointment(bookingSlug, {
        staffId: selectedStaff.id,
        serviceId: selectedService.id,
        startDateTime: selectedSlot.startDateTime,
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone,
      });
    },

    onSuccess: (appointment) => {
      setConfirmedReference(appointment.bookingReference);
      setActiveStep(5);

      notifications.show({
        title: "Appointment booked",
        message: `Your booking reference is ${appointment.bookingReference}`,
        color: "green",
      });
    },

    onError: () => {
      notifications.show({
        title: "Could not create appointment",
        message:
          "The selected slot may no longer be available. Please choose another time.",
        color: "red",
      });
    },
  });

  const business = businessQuery.data;
  const services = servicesQuery.data ?? [];
  const staff = staffQuery.data ?? [];
  const slots = availableSlotsQuery.data?.slots ?? [];

  const selectedSummary = useMemo(() => {
    return {
      service: selectedService?.name ?? "Not selected",
      staff: selectedStaff?.fullName ?? "Not selected",
      date: selectedDate
        ? dayjs(selectedDate).format("DD MMM YYYY")
        : "Not selected",
      time: selectedSlot
        ? `${selectedSlot.startTime} - ${selectedSlot.endTime}`
        : "Not selected",
    };
  }, [selectedService, selectedStaff, selectedDate, selectedSlot]);

  function handleSelectService(service: PublicService) {
    setSelectedService(service);
    setSelectedStaff(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setActiveStep(1);
  }

  function handleSelectStaff(staffMember: PublicStaff) {
    setSelectedStaff(staffMember);
    setSelectedDate(null);
    setSelectedSlot(null);
    setActiveStep(2);
  }

  function handleSelectDate(value: string | null) {
    setSelectedDate(value ? dayjs(value).format("YYYY-MM-DD") : null);
    setSelectedSlot(null);

    if (value) {
      setActiveStep(3);
    }
  }

  function handleSelectSlot(slot: AvailableSlot) {
    setSelectedSlot(slot);
    setActiveStep(4);
  }

  function handleSubmitCustomerDetails(values: CustomerFormValues) {
    createAppointmentMutation.mutate(values);
  }

  if (businessQuery.isLoading || servicesQuery.isLoading) {
    return (
      <Container size="md" py="xl">
        <Group justify="center">
          <Loader />
        </Group>
      </Container>
    );
  }

  if (businessQuery.isError || !business) {
    return (
      <Container size="md" py="xl">
        <Alert color="red" title="Booking page not found">
          This business booking page is unavailable or inactive.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Paper withBorder radius="md" p="xl">
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={2}>{business.name}</Title>
              <Text c="dimmed" mt={4}>
                {business.businessType || "Book an appointment"}
              </Text>

              {business.address && (
                <Text size="sm" mt="sm">
                  {business.address}
                </Text>
              )}

              <Text size="sm" mt="sm">
                Already booked?{" "}
                <Anchor href={`/book/${bookingSlug}/manage`}>
                  Manage your appointment
                </Anchor>
              </Text>
            </div>

            <Badge size="lg" variant="light">
              Booking
            </Badge>
          </Group>
        </Paper>

        <Stepper active={activeStep} onStepClick={setActiveStep}>
          <Stepper.Step label="Service" description="Choose service" />
          <Stepper.Step label="Staff" description="Choose staff" />
          <Stepper.Step label="Date" description="Pick date" />
          <Stepper.Step label="Time" description="Pick slot" />
          <Stepper.Step label="Details" description="Your info" />
          <Stepper.Step label="Done" description="Confirmed" />
        </Stepper>

        <SimpleGrid cols={{ base: 1, md: 3 }}>
          <Card withBorder radius="md">
            <Text size="sm" c="dimmed">
              Service
            </Text>
            <Text fw={600}>{selectedSummary.service}</Text>
          </Card>

          <Card withBorder radius="md">
            <Text size="sm" c="dimmed">
              Staff
            </Text>
            <Text fw={600}>{selectedSummary.staff}</Text>
          </Card>

          <Card withBorder radius="md">
            <Text size="sm" c="dimmed">
              Date & Time
            </Text>
            <Text fw={600}>
              {selectedSummary.date}{" "}
              {selectedSlot ? `, ${selectedSummary.time}` : ""}
            </Text>
          </Card>
        </SimpleGrid>

        {activeStep === 0 && (
          <Card withBorder radius="md" p="lg">
            <Title order={3}>Select a service</Title>
            <Text c="dimmed" mt={4}>
              Choose the service you want to book.
            </Text>

            {services.length === 0 ? (
              <Alert mt="md" color="yellow" icon={<IconInfoCircle size={16} />}>
                No active services are currently available for this business.
              </Alert>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} mt="lg">
                {services.map((service) => (
                  <Card
                    key={service.id}
                    withBorder
                    radius="md"
                    p="lg"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSelectService(service)}
                  >
                    <Stack gap={6}>
                      <Title order={4}>{service.name}</Title>
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {service.description || "No description"}
                      </Text>
                      <Group justify="space-between" mt="sm">
                        <Badge variant="light">
                          {service.durationMinutes} mins
                        </Badge>
                        <Text fw={700}>
                          £{Number(service.price).toFixed(2)}
                        </Text>
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Card>
        )}

        {activeStep === 1 && (
          <Card withBorder radius="md" p="lg">
            <Title order={3}>Select staff</Title>
            <Text c="dimmed" mt={4}>
              Choose who you want to book with.
            </Text>

            {staffQuery.isLoading ? (
              <Group justify="center" py="xl">
                <Loader />
              </Group>
            ) : staff.length === 0 ? (
              <Alert mt="md" color="yellow" icon={<IconInfoCircle size={16} />}>
                No staff members are available for this service.
              </Alert>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} mt="lg">
                {staff.map((staffMember) => (
                  <Card
                    key={staffMember.id}
                    withBorder
                    radius="md"
                    p="lg"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSelectStaff(staffMember)}
                  >
                    <Title order={4}>{staffMember.fullName}</Title>
                    <Text size="sm" c="dimmed">
                      {staffMember.role || "Staff member"}
                    </Text>
                  </Card>
                ))}
              </SimpleGrid>
            )}

            <Button variant="light" mt="lg" onClick={() => setActiveStep(0)}>
              Back to services
            </Button>
          </Card>
        )}

        {activeStep === 2 && (
          <Card withBorder radius="md" p="lg">
            <Title order={3}>Pick a date</Title>
            <Text c="dimmed" mt={4}>
              Select a date to see available appointment times.
            </Text>

            <DatePickerInput
              mt="lg"
              label="Appointment date"
              placeholder="Select date"
              value={selectedDate}
              onChange={handleSelectDate}
              minDate={new Date().toISOString()}
              leftSection={<IconCalendar size={16} />}
              clearable
            />

            <Group mt="lg">
              <Button variant="light" onClick={() => setActiveStep(1)}>
                Back to staff
              </Button>
            </Group>
          </Card>
        )}

        {activeStep === 3 && (
          <Card withBorder radius="md" p="lg">
            <Title order={3}>Pick a time</Title>
            <Text c="dimmed" mt={4}>
              Available slots for {selectedDate}.
            </Text>

            {availableSlotsQuery.isLoading ? (
              <Group justify="center" py="xl">
                <Loader />
              </Group>
            ) : slots.length === 0 ? (
              <Alert mt="md" color="yellow" icon={<IconInfoCircle size={16} />}>
                No available slots for this date. Try another date.
              </Alert>
            ) : (
              <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} mt="lg">
                {slots.map((slot) => (
                  <Button
                    key={slot.startDateTime}
                    variant={
                      selectedSlot?.startDateTime === slot.startDateTime
                        ? "filled"
                        : "light"
                    }
                    onClick={() => handleSelectSlot(slot)}
                  >
                    {slot.startTime}
                  </Button>
                ))}
              </SimpleGrid>
            )}

            <Group mt="lg">
              <Button variant="light" onClick={() => setActiveStep(2)}>
                Back to date
              </Button>
            </Group>
          </Card>
        )}

        {activeStep === 4 && (
          <Card withBorder radius="md" p="lg">
            <Title order={3}>Your details</Title>
            <Text c="dimmed" mt={4}>
              Enter your contact details to confirm the booking.
            </Text>

            <form onSubmit={form.onSubmit(handleSubmitCustomerDetails)}>
              <Stack mt="lg">
                <TextInput
                  label="Full name"
                  placeholder="John Doe"
                  required
                  {...form.getInputProps("customerName")}
                />

                <TextInput
                  label="Email"
                  placeholder="john@example.com"
                  required
                  {...form.getInputProps("customerEmail")}
                />

                <TextInput
                  label="Phone number"
                  placeholder="07123456789"
                  required
                  {...form.getInputProps("customerPhone")}
                />

                <Group justify="space-between">
                  <Button variant="light" onClick={() => setActiveStep(3)}>
                    Back to time
                  </Button>

                  <Button
                    type="submit"
                    loading={createAppointmentMutation.isPending}
                  >
                    Confirm Booking
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        )}

        {activeStep === 5 && (
          <Card withBorder radius="md" p="xl">
            <Stack align="center">
              <IconCheck size={48} color="green" />
              <Title order={3}>Booking confirmed</Title>
              <Text ta="center" c="dimmed">
                Your appointment has been created successfully.
              </Text>

              <Paper withBorder p="md" radius="md">
                <Text size="sm" c="dimmed">
                  Booking Reference
                </Text>
                <Title order={3}>{confirmedReference}</Title>
              </Paper>

              <Button
                variant="light"
                component="a"
                href={`/book/${bookingSlug}/manage`}
              >
                Manage Booking
              </Button>
              <Text size="sm" ta="center">
                Keep this reference safe. You can use it with your email to
                retrieve, cancel, or reschedule your appointment.
              </Text>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
