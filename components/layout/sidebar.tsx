"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { useDashboard } from "@/components/dashboard-provider";
import { footerNavigation, getProjectTone, navigation } from "@/components/layout/navigation-config";
import { Input } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocale } from "@/contexts/locale-context";
import { usePreferences } from "@/contexts/preferences-context";
import { useRisks, useTasks } from "@/lib/hooks/use-api";
import { type MessageKey } from "@/lib/translations";
import { cn } from "@/lib/utils";

function moveMenuFocus(container: HTMLDivElement | null, direction: 1 | -1): void {
  if (!container) return;
  const items = Array.from(container.querySelectorAll<HTMLButtonElement>("[data-workspace-item]"));
  const currentIndex = items.findIndex((item) => item === document.activeElement);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + direction + items.length) % items.length;
  items[nextIndex]?.focus();
}

export function Sidebar({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const workspaceItemsRef = useRef<HTMLDivElement | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { projects, risks: cachedRisks, tasks: cachedTasks } = useDashboard();
  const { risks: liveRisks, isLoading: risksLoading } = useRisks();
  const { tasks: liveTasks, isLoading: tasksLoading } = useTasks();
  const { activeWorkspace, availableWorkspaces, setWorkspaceId } = usePreferences();
  const { t } = useLocale();
  const featuredProjects = projects.slice(0, 4);
  const totalRiskCount =
    liveRisks.length > 0 || !risksLoading ? liveRisks.length : cachedRisks.length;
  const totalTaskCount =
    liveTasks.length > 0 || !tasksLoading ? liveTasks.length : cachedTasks.length;

  useEffect(() => {
    const focusSearch = () => {
      searchRef.current?.focus();
      searchRef.current?.select();
    };

    window.addEventListener("ceoclaw:focus-search", focusSearch);
    return () => window.removeEventListener("ceoclaw:focus-search", focusSearch);
  }, []);

  const handleSearch = (): void => {
    if (!search.trim()) return;
    onNavigate?.();
    router.push(`/projects?query=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div
      className="app-shell-sidebar-content app-shell-scroll-region flex h-full min-h-0 flex-col overflow-y-auto text-[var(--ink)]"
      style={{
        background: "linear-gradient(180deg,var(--surface-sidebar-start) 0%, var(--surface-sidebar-end) 100%)",
        boxShadow: "var(--sidebar-shadow)",
      }}
    >
      <Popover onOpenChange={setWorkspaceOpen} open={workspaceOpen}>
        <PopoverTrigger asChild>
          <button
            aria-haspopup="menu"
            className="flex w-full items-center gap-3 rounded-md border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-left"
            type="button"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-[var(--brand)] text-sm font-semibold text-white">
              {activeWorkspace.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                {t("sidebar.workspace")}
              </p>
              <p className="truncate text-sm font-semibold text-[var(--ink)]">
                {t(activeWorkspace.nameKey as MessageKey)}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-[var(--ink-muted)]" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[calc(var(--sidebar-width)-1.5rem)] max-w-[calc(100vw-2rem)] p-1.5"
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              moveMenuFocus(workspaceItemsRef.current, 1);
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              moveMenuFocus(workspaceItemsRef.current, -1);
            }
          }}
        >
          <div className="grid max-h-[240px] gap-1 overflow-y-auto" ref={workspaceItemsRef} role="menu">
            {availableWorkspaces.map((workspace) => {
              const active = workspace.id === activeWorkspace.id;
              return (
                <button
                  aria-checked={active}
                  className={cn(
                    "flex items-start gap-3 rounded-md px-3 py-2 text-left transition",
                    active ? "bg-[var(--panel-soft)] text-[var(--ink)]" : "text-[var(--ink-soft)] hover:bg-[var(--panel-soft)]"
                  )}
                  data-workspace-item
                  key={workspace.id}
                  onClick={() => {
                    setWorkspaceId(workspace.id);
                    setWorkspaceOpen(false);
                  }}
                  role="menuitemradio"
                  type="button"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-[var(--brand)]/15 text-xs font-semibold text-[var(--brand)]">
                    {workspace.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--ink)]">
                      {t(workspace.nameKey as MessageKey)}
                    </p>
                    <p className="mt-0.5 text-xs leading-4 text-[var(--ink-muted)]">
                      {t(workspace.descriptionKey as MessageKey)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
        <Input
          aria-label={t("topbar.searchPlaceholder")}
          className="border-[var(--line-strong)] bg-[var(--panel-soft)] pl-10 pr-14"
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSearch();
          }}
          placeholder={t("topbar.searchPlaceholder")}
          ref={searchRef}
          value={search}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-sm bg-[var(--kbd-surface)] px-2 py-1 text-xs font-semibold text-[var(--ink-muted)]">
          ⌘K
        </span>
      </div>

      <nav className="grid gap-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
          const badgeValue =
            item.href === "/tasks"
              ? totalTaskCount
              : item.href === "/risks"
                ? totalRiskCount
                : 0;

          return (
            <Link
              key={item.href}
              className={cn(
                "app-shell-nav-link group flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-[var(--ink-soft)] transition hover:bg-[var(--panel-soft)] hover:text-[var(--ink)]",
                active && "bg-[var(--brand)] text-white hover:bg-[var(--brand)] hover:text-white"
              )}
              href={item.href}
              onClick={onNavigate}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
              {badgeValue > 0 ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-[var(--panel-soft)] text-[var(--brand)]"
                  )}
                >
                  {badgeValue}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-2">
        <p className="px-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          {t("sidebar.projectsTitle")}
        </p>
        <p className="mt-1 px-2 text-xs leading-5 text-[var(--ink-muted)]">
          {t("sidebar.projectsDescription")}
        </p>
      </div>

      <div className="grid gap-1">
        {featuredProjects.length ? (
          featuredProjects.map((project) => {
            const active = pathname === `/projects/${project.id}`;
            return (
              <Link
                className={cn(
                  "app-shell-project-link flex min-w-0 items-center gap-3 overflow-hidden rounded-md px-3 py-2 text-sm text-[var(--ink-soft)] transition hover:bg-[var(--panel-soft)] hover:text-[var(--ink)]",
                  active && "bg-[var(--panel-soft)] text-[var(--ink)]"
                )}
                href={`/projects/${project.id}`}
                key={project.id}
                onClick={onNavigate}
              >
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", getProjectTone(project.status))} />
                <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {project.name}
                </span>
                <span className="shrink-0 text-xs text-[var(--ink-muted)]">{project.progress}%</span>
              </Link>
            );
          })
        ) : (
          <div className="rounded-md border border-dashed border-[var(--line)] px-3 py-4 text-sm text-[var(--ink-muted)]">
            {t("sidebar.noProjects")}
          </div>
        )}
      </div>

      <div className="mt-auto grid gap-3 pt-2">
        <div className="rounded-xl border border-[var(--line)] bg-[linear-gradient(180deg,#16233f_0%,#213b74_100%)] p-4 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-white/70">{t("dashboard.portfolioHealth")}</p>
          <p className="mt-2 text-5xl font-semibold tracking-[-0.08em]">81%</p>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/6 px-3 py-2">
              <span className="text-white/75">{t("dashboard.active")}</span>
              <span className="font-semibold text-white">{projects.filter((project) => project.status === "active").length}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/6 px-3 py-2">
              <span className="text-white/75">{t("dashboard.atRisk")}</span>
              <span className="font-semibold text-white">{projects.filter((project) => project.status === "at-risk").length}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-1">
          {footerNavigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--ink-soft)] transition hover:bg-[var(--panel-soft)] hover:text-[var(--ink)]",
                  active && "bg-[var(--panel-soft)] text-[var(--ink)]"
                )}
                href={item.href}
                key={item.href}
                onClick={onNavigate}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{t(item.labelKey)}</span>
                <ChevronRight className="h-4 w-4 text-[var(--ink-muted)]" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
