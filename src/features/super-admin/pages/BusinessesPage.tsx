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
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { PasswordInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import {
  IconEye,
  IconPlus,
  IconPower,
  IconUserPlus,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import {
  createBusiness,
  createBusinessAdmin,
  getBusinesses,
  updateBusinessStatus,
  type Business,
  type BusinessStatus,
} from "../api/super-admin.api";

type BusinessFormValues = {
  name: string;
  email: string;
  phone: string;
  address: string;
  businessType: string;
};

type BusinessAdminFormValues = {
  fullName: string;
  email: string;
  password: string;
};

export default function BusinessesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [businessModalOpened, businessModal] = useDisclosure(false);
  const [adminModalOpened, adminModal] = useDisclosure(false);

  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null
  );

  const businessForm = useForm<BusinessFormValues>({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      businessType: "",
    },

    validate: {
      name: (value) =>
        value.trim().length < 2 ? "Business name is required" : null,
      email: (value) =>
        value && !/^\S+@\S+$/.test(value) ? "Enter a valid email" : null,
    },
  });

  const adminForm = useForm<BusinessAdminFormValues>({
    initialValues: {
      fullName: "",
      email: "",
      password: "",
    },

    validate: {
      fullName: (value) =>
        value.trim().length < 2 ? "Full name is required" : null,
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : "Enter a valid email",
      password: (value) =>
        value.length < 6 ? "Password must be at least 6 characters" : null,
    },
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["super-admin-businesses"],
    queryFn: getBusinesses,
  });

  const createBusinessMutation = useMutation({
    mutationFn: createBusiness,
    onSuccess: () => {
      notifications.show({
        title: "Business created",
        message: "The business has been created successfully.",
        color: "green",
      });

      queryClient.invalidateQueries({ queryKey: ["super-admin-businesses"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-dashboard"] });

      businessForm.reset();
      businessModal.close();
    },
    onError: () => {
      notifications.show({
        title: "Could not create business",
        message: "Please check the details and try again.",
        color: "red",
      });
    },
  });

  const createBusinessAdminMutation = useMutation({
    mutationFn: createBusinessAdmin,
    onSuccess: () => {
      notifications.show({
        title: "Business Admin created",
        message: "The admin account has been created successfully.",
        color: "green",
      });

      queryClient.invalidateQueries({ queryKey: ["super-admin-dashboard"] });

      adminForm.reset();
      setSelectedBusiness(null);
      adminModal.close();
    },
    onError: () => {
      notifications.show({
        title: "Could not create Business Admin",
        message: "The email may already exist.",
        color: "red",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      businessId,
      status,
    }: {
      businessId: string;
      status: BusinessStatus;
    }) => updateBusinessStatus(businessId, status),
    onSuccess: () => {
      notifications.show({
        title: "Business status updated",
        message: "The business status has been changed successfully.",
        color: "green",
      });

      queryClient.invalidateQueries({ queryKey: ["super-admin-businesses"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-dashboard"] });
    },
    onError: () => {
      notifications.show({
        title: "Could not update status",
        message: "Please try again.",
        color: "red",
      });
    },
  });

  function handleCreateBusiness(values: BusinessFormValues) {
    createBusinessMutation.mutate({
      name: values.name,
      email: values.email || undefined,
      phone: values.phone || undefined,
      address: values.address || undefined,
      businessType: values.businessType || undefined,
    });
  }

  function handleOpenAdminModal(business: Business) {
    setSelectedBusiness(business);
    adminForm.reset();
    adminModal.open();
  }

  function handleCreateBusinessAdmin(values: BusinessAdminFormValues) {
    if (!selectedBusiness) return;

    createBusinessAdminMutation.mutate({
      fullName: values.fullName,
      email: values.email,
      password: values.password,
      businessId: selectedBusiness.id,
      role: "BUSINESS_ADMIN",
    });
  }

  function handleToggleStatus(business: Business) {
    const nextStatus: BusinessStatus =
      business.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    statusMutation.mutate({
      businessId: business.id,
      status: nextStatus,
    });
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>Businesses</Title>
            <Text c="dimmed" mt={4}>
              Create businesses, assign Business Admins and manage booking link
              access.
            </Text>
          </div>

          <Button
            leftSection={<IconPlus size={16} />}
            onClick={businessModal.open}
          >
            Create Business
          </Button>
        </Group>

        <Card withBorder radius="md">
          {isLoading ? (
            <Group justify="center" py="xl">
              <Loader />
            </Group>
          ) : isError ? (
            <Text c="red">Could not load businesses.</Text>
          ) : data?.length === 0 ? (
            <Text c="dimmed">No businesses have been created yet.</Text>
          ) : (
            <Table.ScrollContainer minWidth={1100}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Business</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Booking Link</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Created</Table.Th>
                    <Table.Th ta="right">Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {data?.map((business) => (
                    <Table.Tr key={business.id}>
                      <Table.Td>
                        <Text fw={600}>{business.name}</Text>
                        <Text size="xs" c="dimmed">
                          {business.email || "No email"}
                        </Text>
                      </Table.Td>

                      <Table.Td>{business.businessType || "N/A"}</Table.Td>

                      <Table.Td>
                        <Text size="sm">/book/{business.bookingSlug}</Text>
                      </Table.Td>

                      <Table.Td>
                        <Badge
                          color={
                            business.status === "ACTIVE" ? "green" : "gray"
                          }
                        >
                          {business.status}
                        </Badge>
                      </Table.Td>

                      <Table.Td>
                        {dayjs(business.createdAt).format("DD MMM YYYY")}
                      </Table.Td>

                      <Table.Td>
                        <Group justify="flex-end" gap="xs">
                          <Tooltip label="View activity">
                            <ActionIcon
                              variant="light"
                              onClick={() =>
                                navigate(
                                  `/super-admin/businesses/${business.id}/activity`
                                )
                              }
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                          </Tooltip>

                          <Tooltip label="Create Business Admin">
                            <ActionIcon
                              variant="light"
                              onClick={() => handleOpenAdminModal(business)}
                            >
                              <IconUserPlus size={16} />
                            </ActionIcon>
                          </Tooltip>

                          <Tooltip
                            label={
                              business.status === "ACTIVE"
                                ? "Deactivate business"
                                : "Activate business"
                            }
                          >
                            <ActionIcon
                              variant="light"
                              color={
                                business.status === "ACTIVE" ? "red" : "green"
                              }
                              onClick={() => handleToggleStatus(business)}
                              loading={statusMutation.isPending}
                            >
                              <IconPower size={16} />
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
        opened={businessModalOpened}
        onClose={businessModal.close}
        title="Create Business"
        centered
      >
        <form onSubmit={businessForm.onSubmit(handleCreateBusiness)}>
          <Stack>
            <TextInput
              label="Business name"
              placeholder="Elite Cuts"
              required
              {...businessForm.getInputProps("name")}
            />

            <TextInput
              label="Business email"
              placeholder="elite@example.com"
              {...businessForm.getInputProps("email")}
            />

            <TextInput
              label="Phone"
              placeholder="07123456789"
              {...businessForm.getInputProps("phone")}
            />

            <TextInput
              label="Address"
              placeholder="Manchester"
              {...businessForm.getInputProps("address")}
            />

            <TextInput
              label="Business type"
              placeholder="Barber Shop"
              {...businessForm.getInputProps("businessType")}
            />

            <Button type="submit" loading={createBusinessMutation.isPending}>
              Create Business
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={adminModalOpened}
        onClose={adminModal.close}
        title={`Create Business Admin${
          selectedBusiness ? ` for ${selectedBusiness.name}` : ""
        }`}
        centered
      >
        <form onSubmit={adminForm.onSubmit(handleCreateBusinessAdmin)}>
          <Stack>
            <TextInput
              label="Full name"
              placeholder="Business Admin"
              required
              {...adminForm.getInputProps("fullName")}
            />

            <TextInput
              label="Email"
              placeholder="admin@example.com"
              required
              {...adminForm.getInputProps("email")}
            />

            <PasswordInput
              label="Password"
              placeholder="Password123"
              required
              {...adminForm.getInputProps("password")}
            />

            <Button
              type="submit"
              loading={createBusinessAdminMutation.isPending}
            >
              Create Business Admin
            </Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
