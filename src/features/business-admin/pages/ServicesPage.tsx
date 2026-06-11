import { useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Modal,
  NumberInput,
  Stack,
  Switch,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createService,
  deleteService,
  getServices,
  updateService,
  type BusinessService,
} from "../api/services.api";

type ServiceFormValues = {
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
};

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedService, setSelectedService] =
    useState<BusinessService | null>(null);

  const form = useForm<ServiceFormValues>({
    initialValues: {
      name: "",
      description: "",
      durationMinutes: 30,
      price: 0,
      isActive: true,
    },

    validate: {
      name: (value) =>
        value.trim().length < 2 ? "Service name is required" : null,
      durationMinutes: (value) =>
        value <= 0 ? "Duration must be greater than 0" : null,
      price: (value) => (value < 0 ? "Price cannot be negative" : null),
    },
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["business-admin-services"],
    queryFn: getServices,
  });

  const createMutation = useMutation({
    mutationFn: createService,
    onSuccess: () => {
      notifications.show({
        title: "Service created",
        message: "The service has been added successfully.",
        color: "green",
      });

      queryClient.invalidateQueries({ queryKey: ["business-admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["business-admin-dashboard"] });
      handleCloseModal();
    },
    onError: () => {
      notifications.show({
        title: "Could not create service",
        message: "Please check the details and try again.",
        color: "red",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      serviceId,
      payload,
    }: {
      serviceId: string;
      payload: {
        name?: string;
        description?: string;
        durationMinutes?: number;
        price?: number;
        isActive?: boolean;
      };
    }) => updateService(serviceId, payload),
    onSuccess: () => {
      notifications.show({
        title: "Service updated",
        message: "The service has been updated successfully.",
        color: "green",
      });

      queryClient.invalidateQueries({ queryKey: ["business-admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["business-admin-dashboard"] });
      handleCloseModal();
    },
    onError: () => {
      notifications.show({
        title: "Could not update service",
        message: "Please check the details and try again.",
        color: "red",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      notifications.show({
        title: "Service deleted",
        message: "The service has been deleted successfully.",
        color: "green",
      });

      queryClient.invalidateQueries({ queryKey: ["business-admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["business-admin-dashboard"] });
    },
    onError: () => {
      notifications.show({
        title: "Could not delete service",
        message:
          "This service may be linked to staff, appointments or other records.",
        color: "red",
      });
    },
  });

  function handleOpenCreateModal() {
    setSelectedService(null);
    form.reset();
    open();
  }

  function handleOpenEditModal(service: BusinessService) {
    setSelectedService(service);

    form.setValues({
      name: service.name,
      description: service.description ?? "",
      durationMinutes: Number(service.durationMinutes),
      price: Number(service.price),
      isActive: service.isActive,
    });

    open();
  }

  function handleCloseModal() {
    setSelectedService(null);
    form.reset();
    close();
  }

  function handleSubmit(values: ServiceFormValues) {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      durationMinutes: values.durationMinutes,
      price: values.price,
      isActive: values.isActive,
    };

    if (selectedService) {
      updateMutation.mutate({
        serviceId: selectedService.id,
        payload,
      });

      return;
    }

    createMutation.mutate({
      name: payload.name,
      description: payload.description,
      durationMinutes: payload.durationMinutes,
      price: payload.price,
    });
  }

  function handleDelete(serviceId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this service?"
    );

    if (!confirmed) return;

    deleteMutation.mutate(serviceId);
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>Services</Title>
            <Text c="dimmed" mt={4}>
              Manage the services your business offers.
            </Text>
          </div>

          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleOpenCreateModal}
          >
            Add Service
          </Button>
        </Group>

        <Card withBorder radius="md">
          {isLoading ? (
            <Group justify="center" py="xl">
              <Loader />
            </Group>
          ) : isError ? (
            <Text c="red">Could not load services.</Text>
          ) : data?.length === 0 ? (
            <Text c="dimmed">No services have been added yet.</Text>
          ) : (
            <Table.ScrollContainer minWidth={900}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th>Duration</Table.Th>
                    <Table.Th>Price</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th ta="right">Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {data?.map((service) => (
                    <Table.Tr key={service.id}>
                      <Table.Td>
                        <Text fw={600}>{service.name}</Text>
                      </Table.Td>

                      <Table.Td>
                        <Text lineClamp={2}>
                          {service.description || "N/A"}
                        </Text>
                      </Table.Td>

                      <Table.Td>{service.durationMinutes} mins</Table.Td>

                      <Table.Td>£{Number(service.price).toFixed(2)}</Table.Td>

                      <Table.Td>
                        <Badge color={service.isActive ? "green" : "gray"}>
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </Table.Td>

                      <Table.Td>
                        <Group justify="flex-end" gap="xs">
                          <Tooltip label="Edit service">
                            <ActionIcon
                              variant="light"
                              onClick={() => handleOpenEditModal(service)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>

                          <Tooltip label="Delete service">
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleDelete(service.id)}
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
        title={selectedService ? "Edit Service" : "Add Service"}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Service name"
              placeholder="Haircut"
              required
              {...form.getInputProps("name")}
            />

            <Textarea
              label="Description"
              placeholder="Standard haircut service"
              autosize
              minRows={3}
              {...form.getInputProps("description")}
            />

            <NumberInput
              label="Duration in minutes"
              placeholder="30"
              required
              min={1}
              step={5}
              {...form.getInputProps("durationMinutes")}
            />

            <NumberInput
              label="Price"
              placeholder="20"
              required
              min={0}
              decimalScale={2}
              fixedDecimalScale
              prefix="£"
              {...form.getInputProps("price")}
            />

            {selectedService && (
              <Switch
                label="Active service"
                checked={form.values.isActive}
                onChange={(event) =>
                  form.setFieldValue("isActive", event.currentTarget.checked)
                }
              />
            )}

            <Button type="submit" loading={isSubmitting}>
              {selectedService ? "Save Changes" : "Create Service"}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
