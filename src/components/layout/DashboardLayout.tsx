import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Text,
  Title,
  Button,
  Box,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBuilding,
  IconCalendar,
  IconCalendarOff,
  IconClock,
  IconDashboard,
  IconLink,
  IconLogout,
  IconScissors,
  IconUsers,
} from "@tabler/icons-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { getAuthUser, logout } from "../../auth/auth.service";

type NavItem = {
  label: string;
  to: string;
  icon: React.ReactNode;
};

export default function DashboardLayout() {
  const [opened, { toggle }] = useDisclosure();
  const location = useLocation();
  const navigate = useNavigate();
  const user = getAuthUser();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const superAdminLinks: NavItem[] = [
    {
      label: "Dashboard",
      to: "/super-admin/dashboard",
      icon: <IconDashboard size={18} />,
    },
    {
      label: "Businesses",
      to: "/super-admin/businesses",
      icon: <IconBuilding size={18} />,
    },
  ];

  const businessAdminLinks: NavItem[] = [
    {
      label: "Dashboard",
      to: "/business-admin/dashboard",
      icon: <IconDashboard size={18} />,
    },
    {
      label: "Staff",
      to: "/business-admin/staff",
      icon: <IconUsers size={18} />,
    },
    {
      label: "Services",
      to: "/business-admin/services",
      icon: <IconScissors size={18} />,
    },
    {
      label: "Staff Services",
      to: "/business-admin/staff-services",
      icon: <IconLink size={18} />,
    },
    {
      label: "Appointments",
      to: "/business-admin/appointments",
      icon: <IconCalendar size={18} />,
    },
    {
      label: "Availability",
      to: "/business-admin/availability",
      icon: <IconClock size={18} />,
    },
    {
      label: "Blocked Time",
      to: "/business-admin/unavailable-periods",
      icon: <IconCalendarOff size={18} />,
    },
  ];

  const navLinks = isSuperAdmin ? superAdminLinks : businessAdminLinks;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{
        width: 260,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Title order={4}>Appointment Scheduler</Title>
          </Group>

          <Group>
            <Box ta="right" visibleFrom="sm">
              <Text size="sm" fw={600}>
                {user?.fullName}
              </Text>
              <Text size="xs" c="dimmed">
                {user?.role}
              </Text>
            </Box>

            <Button
              variant="light"
              color="red"
              leftSection={<IconLogout size={16} />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap={4}>
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              component={Link}
              to={item.to}
              label={item.label}
              leftSection={item.icon}
              active={location.pathname === item.to}
              variant="filled"
            />
          ))}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
