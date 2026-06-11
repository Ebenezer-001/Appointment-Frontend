import { useState } from "react";
import {
  Anchor,
  Button,
  Container,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { login, saveAuthSession } from "./auth.service";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },

    validate: {
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : "Enter a valid email",
      password: (value) =>
        value.length >= 6 ? null : "Password must be at least 6 characters",
    },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      saveAuthSession(data);

      notifications.show({
        title: "Login successful",
        message: `Welcome back, ${data.user.fullName}`,
        color: "green",
      });

      if (data.user.role === "SUPER_ADMIN") {
        navigate("/super-admin/dashboard");
        return;
      }

      navigate("/business-admin/dashboard");
    },
    onError: () => {
      notifications.show({
        title: "Login failed",
        message: "Invalid email or password",
        color: "red",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  function handleSubmit(values: typeof form.values) {
    setIsSubmitting(true);
    loginMutation.mutate(values);
  }

  return (
    <Container size={420} my={80}>
      <Title ta="center">Appointment Scheduler</Title>

      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Login as Super Admin or Business Admin
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Email"
            placeholder="you@example.com"
            required
            {...form.getInputProps("email")}
          />

          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            mt="md"
            {...form.getInputProps("password")}
          />

          <Button fullWidth mt="xl" type="submit" loading={isSubmitting}>
            Sign in
          </Button>
        </form>

        <Text ta="center" mt="md" size="sm">
          Customer? Use the booking link shared by the business.
        </Text>

        <Text ta="center" mt={4} size="sm">
          Example: <Anchor href="/book/elite-cuts">/book/elite-cuts</Anchor>
        </Text>
      </Paper>
    </Container>
  );
}
