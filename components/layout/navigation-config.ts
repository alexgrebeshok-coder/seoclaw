import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarDays,
  CircleHelp,
  Columns3,
  Database,
  FileText,
  LayoutDashboard,
  LineChart,
  MessageSquareText,
  RefreshCcw,
  Settings2,
  Sparkles,
  Users,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { type MessageKey } from "@/lib/translations";
import type { Project } from "@/lib/types";

export interface NavigationItem {
  href: string;
  icon: LucideIcon;
  label?: string;
  labelKey?: MessageKey;
}

export const navigation: NavigationItem[] = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/projects", labelKey: "nav.projects", icon: BriefcaseBusiness },
  { href: "/tasks", labelKey: "nav.tasks", icon: Workflow },
  { href: "/kanban", labelKey: "nav.kanban", icon: Columns3 },
  { href: "/calendar", labelKey: "nav.calendar", icon: CalendarDays },
  { href: "/gantt", labelKey: "nav.gantt", icon: LineChart },
  { href: "/analytics", labelKey: "nav.analytics", icon: Sparkles },
  { href: "/team", labelKey: "nav.team", icon: Users },
  { href: "/risks", labelKey: "nav.risks", icon: AlertTriangle },
  { href: "/chat", labelKey: "nav.chat", icon: MessageSquareText },
];

export const operationsNavigation: NavigationItem[] = [
  { href: "/imports", label: "Imports", icon: Database },
  { href: "/briefs", label: "Executive Briefs", icon: FileText },
  { href: "/meetings", label: "Meeting to Action", icon: MessageSquareText },
  { href: "/command-center", label: "Command Center", icon: AlertTriangle },
  { href: "/work-reports", label: "Work Reports", icon: RefreshCcw },
  { href: "/integrations", label: "Connector Health", icon: Wrench },
];

export const footerNavigation: NavigationItem[] = [
  { href: "/settings", labelKey: "nav.settings", icon: Settings2 },
  { href: "/help", labelKey: "nav.help", icon: CircleHelp },
];

export interface ResolvedTitle {
  eyebrow?: string;
  eyebrowKey?: MessageKey;
  title?: string;
  titleKey?: MessageKey;
}

const localizedPageTitles: Record<string, ResolvedTitle> = {
  "/": { eyebrowKey: "page.dashboard.eyebrow", titleKey: "page.dashboard.title" },
  "/projects": { eyebrowKey: "page.projects.eyebrow", titleKey: "page.projects.title" },
  "/tasks": { eyebrowKey: "page.tasks.eyebrow", titleKey: "page.tasks.title" },
  "/kanban": { eyebrowKey: "page.kanban.eyebrow", titleKey: "page.kanban.title" },
  "/calendar": { eyebrowKey: "page.calendar.eyebrow", titleKey: "page.calendar.title" },
  "/gantt": { eyebrowKey: "page.gantt.eyebrow", titleKey: "page.gantt.title" },
  "/analytics": { eyebrowKey: "page.analytics.eyebrow", titleKey: "page.analytics.title" },
  "/team": { eyebrowKey: "page.team.eyebrow", titleKey: "page.team.title" },
  "/risks": { eyebrowKey: "page.risks.eyebrow", titleKey: "page.risks.title" },
  "/chat": { eyebrowKey: "page.chat.eyebrow", titleKey: "page.chat.title" },
  "/settings": { eyebrowKey: "page.settings.eyebrow", titleKey: "page.settings.title" },
  "/help": { eyebrowKey: "page.help.eyebrow", titleKey: "page.help.title" },
  "/imports": { eyebrow: "Data intake", title: "Imports" },
  "/briefs": { eyebrow: "Executive comms", title: "Executive Briefs" },
  "/meetings": { eyebrow: "Agentic intake", title: "Meeting to Action" },
  "/command-center": { eyebrow: "Exception control", title: "Executive Command Center" },
  "/work-reports": { eyebrow: "Delivery cadence", title: "Work Reports" },
  "/integrations": { eyebrow: "Platform trust", title: "Connector Health" },
};

export function resolveTitle(pathname: string | null): ResolvedTitle {
  const safePathname = pathname ?? "/";

  if (safePathname.startsWith("/projects/")) {
    return {
      eyebrowKey: "page.project.eyebrow",
      titleKey: "page.project.title",
    };
  }

  if (safePathname.startsWith("/imports/")) {
    return localizedPageTitles["/imports"];
  }

  if (safePathname.startsWith("/briefs/")) {
    return localizedPageTitles["/briefs"];
  }

  if (safePathname.startsWith("/meetings/")) {
    return localizedPageTitles["/meetings"];
  }

  if (safePathname.startsWith("/command-center/")) {
    return localizedPageTitles["/command-center"];
  }

  if (safePathname.startsWith("/work-reports/")) {
    return localizedPageTitles["/work-reports"];
  }

  if (safePathname.startsWith("/integrations/")) {
    return localizedPageTitles["/integrations"];
  }

  return localizedPageTitles[safePathname as keyof typeof localizedPageTitles] ?? localizedPageTitles["/"];
}

export function getProjectTone(status: Project["status"]): string {
  switch (status) {
    case "active":
      return "bg-emerald-500";
    case "planning":
      return "bg-sky-500";
    case "completed":
      return "bg-violet-500";
    case "at-risk":
      return "bg-rose-500";
    default:
      return "bg-amber-500";
  }
}
