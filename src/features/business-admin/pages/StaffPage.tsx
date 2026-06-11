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
  Switch,
  Table,
  Text,
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
  createStaff,
  deleteStaff,
  getStaff,
  updateStaff,
  type Staff,
} from "../api/staff.api";

type StaffFormValues = {
  fullName: string;
  role: string;
  email: string;
  phone: string;
  isActive: boolean;
};

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const form = useForm<StaffFormValues>({
    initialValues: {
      fullName: "",
      role: "",
      email: "",
      phone: "",
      isActive: true,
    },

    validate: {
      fullName: (value) =>
        value.trim().length < 2 ? "Full name is required" : null,
      email: (value) =>
        value && !/^\S+@\S+$/.test(value) ? "Enter a valid email" : null,
    },
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["business-admin-staff"],
    queryFn: getStaff,
  });

  const createMutation = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      notifications.show({
        title: "Staff created",
        message: "The staff member has been added successfully.",
        color: "green",
      });

      queryClient.invalidateQueries({ queryKey: ["business-admin-staff"] });
      queryClient.invalidateQueries({ queryKey: ["business-admin-dashboard"] });
      handleCloseModal();
    },
    onError: () => {
      notifications.show({
        title: "Could not create staff",
        message: "Please check the details and try again.",
        color: "red",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      staffId,
      payload,
    }: {
      staffId: string;
      payload: {
        fullName?: string;
        role?: string;
        email?: string;
        phone?: string;
        isActive?: boolean;
      };
    }) => updateStaff(staffId, payload),
    onSuccess: () => {
      notifications.show({
        title: "Staff updated",
        message: "The staff member has been updated successfully.",
        color: "green",
      });

      queryClient.invalidateQueries({ queryKey: ["business-admin-staff"] });
      queryClient.invalidateQueries({ queryKey: ["business-admin-dashboard"] });
      handleCloseModal();
    },
    onError: () => {
      notifications.show({
        title: "Could not update staff",
        message: "Please check the details and try again.",
        color: "red",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      notifications.show({
        title: "Staff deleted",
        message: "The staff member has been deleted successfully.",
        color: "green",
      });

      queryClient.invalidateQueries({ queryKey: ["business-admin-staff"] });
      queryClient.invalidateQueries({ queryKey: ["business-admin-dashboard"] });
    },
    onError: () => {
      notifications.show({
        title: "Could not delete staff",
        message:
          "This staff member may be linked to appointments or other records.",
        color: "red",
      });
    },
  });

  function handleOpenCreateModal() {
    setSelectedStaff(null);
    form.reset();
    open();
  }

  function handleOpenEditModal(staff: Staff) {
    setSelectedStaff(staff);

    form.setValues({
      fullName: staff.fullName,
      role: staff.role ?? "",
      email: staff.email ?? "",
      phone: staff.phone ?? "",
      isActive: staff.isActive,
    });

    open();
  }

  function handleCloseModal() {
    setSelectedStaff(null);
    form.reset();
    close();
  }

  function handleSubmit(values: StaffFormValues) {
    const payload = {
      fullName: values.fullName,
      role: values.role || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      isActive: values.isActive,
    };

    if (selectedStaff) {
      updateMutation.mutate({
        staffId: selectedStaff.id,
        payload,
      });

      return;
    }

    createMutation.mutate({
      fullName: payload.fullName,
      role: payload.role,
      email: payload.email,
      phone: payload.phone,
    });
  }

  function handleDelete(staffId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this staff member?"
    );

    if (!confirmed) return;

    deleteMutation.mutate(staffId);
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>Staff</Title>
            <Text c="dimmed" mt={4}>
              Manage staff members for your business.
            </Text>
          </div>

          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleOpenCreateModal}
          >
            Add Staff
          </Button>
        </Group>

        <Card withBorder radius="md">
          {isLoading ? (
            <Group justify="center" py="xl">
              <Loader />
            </Group>
          ) : isError ? (
            <Text c="red">Could not load staff.</Text>
          ) : data?.length === 0 ? (
            <Text c="dimmed">No staff members have been added yet.</Text>
          ) : (
            <Table.ScrollContainer minWidth={900}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Role</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Phone</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th ta="right">Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {data?.map((staff) => (
                    <Table.Tr key={staff.id}>
                      <Table.Td>
                        <Text fw={600}>{staff.fullName}</Text>
                      </Table.Td>

                      <Table.Td>{staff.role || "N/A"}</Table.Td>
                      <Table.Td>{staff.email || "N/A"}</Table.Td>
                      <Table.Td>{staff.phone || "N/A"}</Table.Td>

                      <Table.Td>
                        <Badge color={staff.isActive ? "green" : "gray"}>
                          {staff.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </Table.Td>

                      <Table.Td>
                        <Group justify="flex-end" gap="xs">
                          <Tooltip label="Edit staff">
                            <ActionIcon
                              variant="light"
                              onClick={() => handleOpenEditModal(staff)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>

                          <Tooltip label="Delete staff">
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleDelete(staff.id)}
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
        title={selectedStaff ? "Edit Staff" : "Add Staff"}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Full name"
              placeholder="John Barber"
              required
              {...form.getInputProps("fullName")}
            />

            <TextInput
              label="Role"
              placeholder="Senior Barber"
              {...form.getInputProps("role")}
            />

            <TextInput
              label="Email"
              placeholder="john@example.com"
              {...form.getInputProps("email")}
            />

            <TextInput
              label="Phone"
              placeholder="07123456789"
              {...form.getInputProps("phone")}
            />

            {selectedStaff && (
              <Switch
                label="Active staff member"
                checked={form.values.isActive}
                onChange={(event) =>
                  form.setFieldValue("isActive", event.currentTarget.checked)
                }
              />
            )}

            <Button type="submit" loading={isSubmitting}>
              {selectedStaff ? "Save Changes" : "Create Staff"}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
