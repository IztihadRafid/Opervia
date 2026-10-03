import {
  Activity,
  AppWindow,
  Building2,
  CreditCard,
  LayoutDashboard,
  KeyRound,
  Receipt,
  Settings,
  Users,
} from "lucide-react";

export const mainNavigation = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Applications",
    href: "/applications",
    icon: AppWindow,
  },
  {
    title: "Subscriptions",
    href: "/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Vendors",
    href: "/vendors",
    icon: Building2,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
  },
  {
    title: "Licenses",
    href: "/licenses",
    icon: KeyRound,
  },
  {
    title: "Expenses",
    href: "/expenses",
    icon: Receipt,
  },
  {
    title: "Activity",
    href: "/activity",
    icon: Activity,
  },
];

export const settingsNavigation = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];