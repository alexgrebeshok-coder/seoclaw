"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, format } from "date-fns";
import { Menu, MessageSquareText, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { useDashboard } from "@/components/dashboard-provider";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { resolveTitle } from "@/components/layout/navigation-config";
import { ProjectFormModal } from "@/components/projects/project-form-modal";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocale } from "@/contexts/locale-context";
import { usePreferences } from "@/contexts/preferences-context";
import { cn } from "@/lib/utils";

function moveMenuFocus(container: HTMLDivElement | null, direction: 1 | -1): void {
  if (!container) return;
  const items = Array.from(container.querySelectorAll<HTMLElement>("[data-menu-item]"));
  const currentIndex = items.findIndex((item) => item === document.activeElement);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + direction + items.length) % items.length;
  items[nextIndex]?.focus();
}

function QuickActionsPopover({
  onAddProject,
  onAddTask,
  onAssignResource,
  onQuickTask,
}: {
  onAddProject: () => void;
  onAddTask: () => void;
  onAssignResource: () => void;
  onQuickTask: () => void;
}) {
  const { t } = useLocale();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button aria-label={t("topbar.quickActions")} variant="secondary">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("topbar.quickActions")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 p-2"
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            moveMenuFocus(contentRef.current, 1);
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            moveMenuFocus(contentRef.current, -1);
          }
        }}
      >
        <CardContent className="grid gap-1 p-0" ref={contentRef} role="menu">
          {[
            { label: t("action.addProject"), onClick: onAddProject },
            { label: t("action.addTask"), onClick: onAddTask },
            { label: t("topbar.quickTask"), onClick: onQuickTask },
            { label: t("topbar.assignResource"), onClick: onAssignResource },
          ].map((item) => (
            <button
              className="rounded-md px-3 py-2 text-left text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--panel-soft)]"
              data-menu-item
              key={item.label}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              role="menuitem"
              type="button"
            >
              {item.label}
            </button>
          ))}
        </CardContent>
      </PopoverContent>
    </Popover>
  );
}

function NotificationsPopover() {
  const { enumLabel, t } = useLocale();
  const { notifications } = useDashboard();
  const contentRef = useRef<HTMLDivElement | null>(null);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button aria-label={t("topbar.criticalFeed")} className="relative" size="icon" variant="secondary">
          <Bell className="h-4 w-4" />
          {notifications.length ? (
            <div className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-semibold text-white">
              {notifications.length}
            </div>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] p-4"
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            moveMenuFocus(contentRef.current, 1);
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            moveMenuFocus(contentRef.current, -1);
          }
        }}
      >
        <CardContent aria-label={t("topbar.criticalFeed")} className="space-y-3 p-0" ref={contentRef} role="dialog">
          <div className="flex items-center justify-between">
            <CardTitle>{t("topbar.criticalFeed")}</CardTitle>
            <Badge variant="danger">{notifications.length}</Badge>
          </div>
          <div className="grid gap-2">
            {notifications.map((item) => (
              <Link
                className="rounded-md border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-3 transition hover:bg-[color:var(--surface-panel-strong)]"
                data-menu-item
                href={item.projectId ? `/projects/${item.projectId}` : "/"}
                key={item.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">{item.title}</p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">{item.description}</p>
                  </div>
                  <Badge
                    className={cn(
                      "ring-1",
                      item.severity === "critical"
                        ? "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/14 dark:text-rose-300 dark:ring-rose-500/18"
                        : item.severity === "warning"
                          ? "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/14 dark:text-amber-300 dark:ring-amber-500/18"
                          : "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/14 dark:text-sky-300 dark:ring-sky-500/18"
                    )}
                  >
                    {enumLabel("severity", item.severity)}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </PopoverContent>
    </Popover>
  );
}

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const { activeWorkspace } = usePreferences();
  const { locale, t } = useLocale();
  const { projects, addTask } = useDashboard();
  const { eyebrowKey, titleKey } = resolveTitle(pathname);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        window.dispatchEvent(new Event("seoclaw:focus-search"));
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const localizedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale, {
        weekday: "long",
        day: "numeric",
        month: "short",
      }).format(new Date()),
    [locale]
  );

  const handleSearch = (): void => {
    if (!search.trim()) return;
    router.push(`/projects?query=${encodeURIComponent(search.trim())}`);
  };

  const handleQuickTask = async (): Promise<void> => {
    const targetProject = projects.find((project) => project.status === "active") ?? projects[0];
    if (!targetProject) return;
    await addTask({
      projectId: targetProject.id,
      title: t("topbar.quickTask"),
      assignee: targetProject.team[0] ?? t("misc.defaultAssignee"),
      dueDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
      priority: "medium",
      description: t("topbar.quickTask"),
    });
  };

  const handleAssignResource = (): void => {
    toast.success(t("toast.assignResource"), {
      description: t("toast.assignResourceDesc"),
    });
  };

  return (
    <>
      <header className="shrink-0 border-b border-[color:var(--line-strong)] bg-[color:var(--surface-panel)]">
        <div className="app-shell-topbar-stack flex flex-col px-4 py-5 sm:px-6 lg:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Button
                aria-label={t("chat.sidebar.toggle")}
                className="lg:hidden"
                onClick={onOpenMenu}
                size="icon"
                variant="secondary"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  {t(eyebrowKey)}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h1 className="font-heading text-5xl font-semibold leading-none tracking-[-0.06em] text-[var(--ink)]">
                    {t(titleKey)}
                  </h1>
                  <span className="hidden text-sm text-[var(--ink-muted)] md:inline">{localizedDate}</span>
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <Button
                aria-label={t("topbar.searchPlaceholder")}
                onClick={() => window.dispatchEvent(new Event("seoclaw:focus-search"))}
                variant="secondary"
              >
                ⌘K
              </Button>

              <Link className={buttonVariants({ variant: "outline" })} href="/chat">
                <MessageSquareText className="h-4 w-4" />
                {t("topbar.aiWorkspace")}
              </Link>

              <QuickActionsPopover
                onAddProject={() => setProjectModalOpen(true)}
                onAddTask={() => setTaskModalOpen(true)}
                onAssignResource={handleAssignResource}
                onQuickTask={() => {
                  void handleQuickTask();
                }}
              />

              <NotificationBell />
              <LanguageSwitcher />
              <ThemeSwitcher />

              <Link
                aria-label={t("settings.workspaceLabel")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface-panel)] text-sm font-semibold text-[var(--ink)]"
                href="/team"
              >
                {activeWorkspace.initials}
              </Link>

              <Button onClick={() => setProjectModalOpen(true)}>{t("action.addProject")}</Button>
            </div>
          </div>

          <div className="grid gap-3 lg:hidden">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
              <Input
                aria-label={t("topbar.searchPlaceholder")}
                className="pl-11"
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder={t("topbar.searchPlaceholder")}
                value={search}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button className="flex-1" onClick={() => setProjectModalOpen(true)}>
                {t("action.addProject")}
              </Button>
              <NotificationBell />
              <QuickActionsPopover
                onAddProject={() => setProjectModalOpen(true)}
                onAddTask={() => setTaskModalOpen(true)}
                onAssignResource={handleAssignResource}
                onQuickTask={() => {
                  void handleQuickTask();
                }}
              />
              <Link className={buttonVariants({ variant: "outline" })} href="/chat">
                <MessageSquareText className="h-4 w-4" />
                {t("topbar.aiWorkspace")}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <ProjectFormModal open={projectModalOpen} onOpenChange={setProjectModalOpen} />
      <TaskFormModal open={taskModalOpen} onOpenChange={setTaskModalOpen} />
    </>
  );
}
