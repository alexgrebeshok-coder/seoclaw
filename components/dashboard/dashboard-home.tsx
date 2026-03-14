"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BriefcaseBusiness,
  Clock3,
  FileText,
  FolderKanban,
  ListTodo,
  Users2,
} from "lucide-react";

import { AIContextActions } from "@/components/ai/ai-context-actions";
import { useDashboard } from "@/components/dashboard-provider";
import { AlertsBlock } from "@/components/dashboard/alerts-block";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { KpiDetailModal, type KpiBreakdownItem, type KpiAction } from "@/components/dashboard/kpi-detail-modal";
import { ProjectFormModal } from "@/components/projects/project-form-modal";
import { ProjectCard } from "@/components/projects/project-card";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { EVMMetricsCard } from "@/components/analytics/evm-metrics-card";
import { AutoRisksCard } from "@/components/analytics/auto-risks-card";
import { AIInsightsCard } from "@/components/analytics/ai-insights-card";
import { PortfolioHealthCard } from "@/components/analytics/portfolio-health-card";
import { RecommendationsCard } from "@/components/analytics/recommendations-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ClientChart } from "@/components/ui/client-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fieldStyles } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import {
  AIContextActionsSkeleton,
  ChartSkeleton,
  KpiCardSkeleton,
  ProjectCardSkeleton,
  Skeleton,
} from "@/components/ui/skeleton";
import { DataErrorState } from "@/components/ui/data-error-state";
import { useLocale } from "@/contexts/locale-context";
import { downloadProjectsCsv, downloadDashboardPdf } from "@/lib/export";
import { useDashboardSnapshot } from "@/lib/hooks/use-api";
import { useEVMMetrics } from "@/lib/hooks/use-evm-metrics";
import { useAutoRisks } from "@/lib/hooks/use-auto-risks";
import { useAIInsights } from "@/lib/hooks/use-ai-insights";
import { usePortfolioHealth } from "@/lib/hooks/use-portfolio-health";
import { useRecommendations } from "@/lib/hooks/use-recommendations";
import { Project } from "@/lib/types";
import { leadingLabel, safePercent } from "@/lib/utils";

const DashboardTrendChart = dynamic(
  () =>
    import("@/components/dashboard/dashboard-trend-chart").then(
      (module) => module.DashboardTrendChart
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

const DashboardBudgetChart = dynamic(
  () =>
    import("@/components/dashboard/dashboard-budget-chart").then(
      (module) => module.DashboardBudgetChart
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

const DashboardRiskChart = dynamic(
  () =>
    import("@/components/dashboard/dashboard-risk-chart").then(
      (module) => module.DashboardRiskChart
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

function buildPortfolioTrend(
  projects: Project[],
  formatDateLocalized: (date: string, pattern?: string) => string
) {
  if (!projects.length) {
    return [];
  }

  const longestHistory = Math.max(...projects.map((project) => project.history.length));
  return Array.from({ length: longestHistory }, (_, index) => {
    const points = projects
      .map((project) => project.history[index])
      .filter(Boolean);

    return {
      name: points[0]?.date ? formatDateLocalized(points[0].date) : `P${index + 1}`,
      progress: Math.round(
        points.reduce((sum, point) => sum + point.progress, 0) / Math.max(points.length, 1)
      ),
      actual: Math.round(points.reduce((sum, point) => sum + point.budgetActual, 0) / 1000),
      planned: Math.round(points.reduce((sum, point) => sum + point.budgetPlanned, 0) / 1000),
    };
  });
}

export function DashboardHome() {
  const { enumLabel, formatDateLocalized, locale, t } = useLocale();
  const {
    documents: providerDocuments,
    duplicateProject,
    notifications,
    projects: providerProjects,
    risks: providerRisks,
    tasks: providerTasks,
    team: providerTeam,
  } = useDashboard();
  const {
    documents: snapshotDocuments,
    error,
    isLoading,
    projects: snapshotProjects,
    retry,
    risks: snapshotRisks,
    tasks: snapshotTasks,
    team: snapshotTeam,
  } = useDashboardSnapshot();
  const [statusFilter, setStatusFilter] = useState<"all" | Project["status"]>("all");
  const [directionFilter, setDirectionFilter] = useState<"all" | Project["direction"]>("all");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [kpiModalState, setKpiModalState] = useState<{
    open: boolean;
    title: string;
    value: string;
    description: string;
    icon: typeof BriefcaseBusiness;
    tone: "neutral" | "success" | "warning" | "danger";
    breakdown?: KpiBreakdownItem[];
    actions?: KpiAction[];
  } | null>(null);

  const projects = snapshotProjects.length > 0 ? snapshotProjects : providerProjects;
  const tasks = snapshotTasks.length > 0 ? snapshotTasks : providerTasks;
  const team = snapshotTeam.length > 0 ? snapshotTeam : providerTeam;
  const risks = snapshotRisks.length > 0 ? snapshotRisks : providerRisks;
  const documents = snapshotDocuments.length > 0 ? snapshotDocuments : providerDocuments;
  const hasFallbackData =
    projects.length > 0 ||
    tasks.length > 0 ||
    team.length > 0 ||
    risks.length > 0 ||
    documents.length > 0;

  const filteredProjects = projects.filter((project) => {
    const statusMatch = statusFilter === "all" ? true : project.status === statusFilter;
    const directionMatch =
      directionFilter === "all" ? true : project.direction === directionFilter;
    return statusMatch && directionMatch;
  });

  const totalPlanned = projects.reduce((sum, project) => sum + project.budget.planned, 0);
  const totalActual = projects.reduce((sum, project) => sum + project.budget.actual, 0);
  const budgetUsed = safePercent(totalActual, totalPlanned);
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((task) => task.status === "in-progress").length;
  const openRiskCount = notifications.filter((notification) => notification.severity !== "info").length;
  const activeProjects = projects.filter((project) => project.status === "active").length;
  const nextMilestones = projects.filter((project) => project.nextMilestone).slice(0, 2);

  // EVM Metrics: select project with largest budget for EVM display
  const evmProject = useMemo(() => {
    if (!projects.length) return null;
    // Prefer active project with largest budget
    const activeWithBudget = projects
      .filter((p) => p.status === "active" && p.budget.planned > 0)
      .sort((a, b) => b.budget.planned - a.budget.planned);
    return activeWithBudget[0] ?? projects[0];
  }, [projects]);

  const evmMetrics = useEVMMetrics(evmProject);

  // Auto-detected risks for EVM project
  const autoRisks = useAutoRisks(
    evmProject,
    tasks.filter((t) => t.projectId === evmProject?.id),
    team.filter((m) => evmProject?.team.includes(m.name)),
    risks.filter((r) => r.projectId === evmProject?.id)
  );

  // Portfolio health
  const portfolioHealth = usePortfolioHealth();

  // AI-powered recommendations
  const portfolioHealthSummary = useMemo(() => ({
    overall: portfolioHealth?.overall ?? 0,
    budgetVariance: 0,
    critical: projects.filter(p => p.status === "at-risk").length,
  }), [projects, portfolioHealth]);

  const aiInsights = useMemo(() => ({
    overall: portfolioHealth?.overall ?? 0,
    healthy: projects.filter(p => p.status === "active" && p.health > 75).length,
    atRisk: projects.filter(p => p.status === "at-risk").length,
    critical: projects.filter(p => p.status === "at-risk" || p.health < 50).length,
    insights: [],
  }), [projects, portfolioHealth]);

  // AI Insights
  const { insights: aiInsightsList } = useAIInsights();

  const { recommendations } = useRecommendations(
    projects,
    portfolioHealth,
    aiInsightsList
  );

  const trendData = buildPortfolioTrend(projects, formatDateLocalized);
  const budgetData = projects.map((project) => ({
    name: leadingLabel(project.name),
    planned: Math.round(project.budget.planned / 100000),
    actual: Math.round(project.budget.actual / 100000),
  }));
  const riskData = [
    {
      name: enumLabel("severity", "critical"),
      value: notifications.filter((notification) => notification.severity === "critical").length,
      color: "#fb7185",
    },
    {
      name: enumLabel("severity", "warning"),
      value: notifications.filter((notification) => notification.severity === "warning").length,
      color: "#f59e0b",
    },
    {
      name: enumLabel("severity", "info"),
      value: notifications.filter((notification) => notification.severity === "info").length,
      color: "#38bdf8",
    },
  ];

  const topDocuments = documents.slice(0, 4);
  const showHydrationSkeleton =
    isLoading && projects.length === 0 && tasks.length === 0 && documents.length === 0;

  if (showHydrationSkeleton) {
    return (
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 6 }, (_, index) => (
            <KpiCardSkeleton key={index} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <Card className="overflow-hidden">
            <CardContent className="grid gap-5 p-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(260px,.88fr)]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Skeleton className="h-7 w-56 rounded-full" />
                  <Skeleton className="h-12 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Skeleton className="h-11 w-40" />
                  <Skeleton className="h-11 w-40" />
                  <Skeleton className="h-11 w-40" />
                  <Skeleton className="h-11 w-36" />
                </div>
              </div>
              <div className="grid gap-4">
                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-7 w-14 rounded-full" />
                  </div>
                  <Skeleton className="mt-4 h-12 w-36" />
                  <Skeleton className="mt-4 h-2.5 w-full rounded-full" />
                  <Skeleton className="mt-3 h-4 w-5/6" />
                </div>
                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-5">
                  <Skeleton className="h-4 w-36" />
                  <div className="mt-4 grid gap-3">
                    {Array.from({ length: 2 }, (_, index) => (
                      <div
                        key={index}
                        className="rounded-[10px] border border-[var(--line)] bg-[color:var(--surface-panel)] px-4 py-3"
                      >
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="mt-2 h-4 w-2/3" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="grid gap-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-5 w-4/5" />
                      <Skeleton className="h-4 w-3/5" />
                    </div>
                    <Skeleton className="h-5 w-5 rounded-sm" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <AIContextActionsSkeleton />

        <section className="grid gap-6 2xl:grid-cols-[1.12fr_.88fr]">
          <div className="grid gap-6">
            <Card>
              <CardHeader className="flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-7 w-52" />
                  <Skeleton className="h-4 w-72" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-12 w-44" />
                  <Skeleton className="h-12 w-44" />
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 xl:grid-cols-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <ProjectCardSkeleton key={index} />
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
              {Array.from({ length: 2 }, (_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <ChartSkeleton className="h-[320px]" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            {Array.from({ length: 4 }, (_, index) => (
              <Card key={index}>
                <CardContent className="space-y-4 p-6">
                  <Skeleton className="h-7 w-40" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error && !hasFallbackData) {
    return (
      <DataErrorState
        actionLabel={t("action.retry")}
        description={t("error.loadDescription")}
        onRetry={retry}
        title={t("error.loadTitle")}
      />
    );
  }

  return (
    <>
      <div className="grid gap-6">
        <AlertsBlock projects={projects} risks={risks} />

        <section className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            description={t("dashboard.kpi.activeProjectsDescription")}
            icon={BriefcaseBusiness}
            title={t("dashboard.kpi.activeProjects")}
            tone="neutral"
            value={String(activeProjects)}
            onClick={() => setKpiModalState({
              open: true,
              title: t("dashboard.kpi.activeProjects"),
              value: String(activeProjects),
              description: t("dashboard.kpi.activeProjectsDescription"),
              icon: BriefcaseBusiness,
              tone: "neutral",
              breakdown: [
                { label: t("projectStatus.active"), value: projects.filter(p => p.status === "active").length, tone: "success" },
                { label: t("projectStatus.planning"), value: projects.filter(p => p.status === "planning").length, tone: "neutral" },
                { label: t("projectStatus.at-risk"), value: projects.filter(p => p.status === "at-risk").length, tone: "danger" },
                { label: t("projectStatus.on-hold"), value: projects.filter(p => p.status === "on-hold").length, tone: "warning" },
              ],
              actions: [{ label: t("action.openPortfolio"), href: "/projects" }],
            })}
          />
          <KpiCard
            description={t("dashboard.kpi.portfolioStatusDescription")}
            icon={FolderKanban}
            title={t("dashboard.kpi.portfolioStatus")}
            tone={(portfolioHealth?.overall ?? 0) >= 70 ? "success" : "warning"}
            value={`${portfolioHealth?.overall ?? 0}%`}
            onClick={() => setKpiModalState({
              open: true,
              title: t("dashboard.kpi.portfolioStatus"),
              value: `${portfolioHealth?.overall ?? 0}%`,
              description: t("dashboard.kpi.portfolioStatusDescription"),
              icon: FolderKanban,
              tone: (portfolioHealth?.overall ?? 0) >= 70 ? "success" : "warning",
              breakdown: [
                { label: t("project.progress"), value: `${Math.round(projects.reduce((s, p) => s + p.progress, 0) / Math.max(projects.length, 1))}%`, tone: "neutral" },
                { label: t("project.health"), value: `${portfolioHealth?.overall ?? 0}%`, tone: (portfolioHealth?.overall ?? 0) >= 70 ? "success" : "warning" },
                { label: t("dashboard.budgetVariance"), value: `${budgetUsed}%`, tone: budgetUsed > 90 ? "danger" : budgetUsed > 75 ? "warning" : "success" },
              ],
              actions: [{ label: t("action.openPortfolio"), href: "/projects" }],
            })}
          />
          <KpiCard
            description={t("tasks.total")}
            icon={ListTodo}
            title={t("tasks.total")}
            tone="neutral"
            value={String(totalTasks)}
            onClick={() => setKpiModalState({
              open: true,
              title: t("tasks.total"),
              value: String(totalTasks),
              description: t("tasks.description"),
              icon: ListTodo,
              tone: "neutral",
              breakdown: [
                { label: t("taskStatus.todo"), value: tasks.filter(t => t.status === "todo").length, tone: "neutral" },
                { label: t("taskStatus.in-progress"), value: tasks.filter(t => t.status === "in-progress").length, tone: "warning" },
                { label: t("taskStatus.done"), value: tasks.filter(t => t.status === "done").length, tone: "success" },
                { label: t("taskStatus.blocked"), value: tasks.filter(t => t.status === "blocked").length, tone: "danger" },
              ],
              actions: [{ label: t("nav.tasks"), href: "/tasks" }],
            })}
          />
          <KpiCard
            description={t("tasks.inProgress")}
            icon={Clock3}
            title={t("tasks.inProgress")}
            tone={inProgressTasks > 0 ? "warning" : "neutral"}
            value={String(inProgressTasks)}
            onClick={() => setKpiModalState({
              open: true,
              title: t("tasks.inProgress"),
              value: String(inProgressTasks),
              description: t("tasks.description"),
              icon: Clock3,
              tone: inProgressTasks > 0 ? "warning" : "neutral",
              breakdown: [
                { label: t("tasks.total"), value: totalTasks },
                { label: t("tasks.inProgress"), value: inProgressTasks, tone: "warning" },
                { label: t("tasks.blocked"), value: tasks.filter(t => t.status === "blocked").length, tone: "danger" },
              ],
              actions: [{ label: t("nav.tasks"), href: "/tasks" }],
            })}
          />
          <KpiCard
            description={t("dashboard.criticalFeedDescription")}
            icon={AlertTriangle}
            title={t("dashboard.criticalFeed")}
            tone={openRiskCount > 0 ? "danger" : "success"}
            value={String(openRiskCount)}
            onClick={() => setKpiModalState({
              open: true,
              title: t("dashboard.criticalFeed"),
              value: String(openRiskCount),
              description: t("dashboard.criticalFeedDescription"),
              icon: AlertTriangle,
              tone: openRiskCount > 0 ? "danger" : "success",
              breakdown: [
                { label: t("severity.critical"), value: notifications.filter(n => n.severity === "critical").length, tone: "danger" },
                { label: t("severity.warning"), value: notifications.filter(n => n.severity === "warning").length, tone: "warning" },
                { label: t("severity.info"), value: notifications.filter(n => n.severity === "info").length, tone: "neutral" },
              ],
              actions: [{ label: t("nav.risks"), href: "/risks" }],
            })}
          />
          <KpiCard
            description={t("dashboard.teamLoadDescription")}
            icon={Users2}
            title={t("nav.team")}
            tone="neutral"
            value={String(team.length)}
            onClick={() => setKpiModalState({
              open: true,
              title: t("nav.team"),
              value: String(team.length),
              description: t("dashboard.teamLoadDescription"),
              icon: Users2,
              tone: "neutral",
              breakdown: [
                { label: t("dashboard.active"), value: team.filter(m => m.allocated < 70).length, tone: "success" },
                { label: t("dashboard.atRisk"), value: team.filter(m => m.allocated >= 70 && m.allocated < 85).length, tone: "warning" },
                { label: t("severity.critical"), value: team.filter(m => m.allocated >= 85).length, tone: "danger" },
              ],
              actions: [{ label: t("nav.team"), href: "/team" }],
            })}
          />
        </section>

        {/* EVM Metrics Section */}
        {evmProject && evmMetrics && (
          <section className="grid gap-6 xl:grid-cols-[1fr]">
            <EVMMetricsCard
              metrics={evmMetrics}
              budget={evmProject.budget}
              isLoading={isLoading}
            />
          </section>
        )}

        {/* Auto-detected Risks Section */}
        {autoRisks.length > 0 && (
          <section className="grid gap-6 xl:grid-cols-[1fr]">
            <AutoRisksCard risks={autoRisks} maxDisplay={5} />
          </section>
        )}

        {/* Portfolio Health Section */}
        {portfolioHealth && (
          <section className="grid gap-6 xl:grid-cols-[1fr]">
            <PortfolioHealthCard
              healthScore={portfolioHealth}
              isLoading={isLoading}
            />
          </section>
        )}

        {/* AI Insights Section */}
        {aiInsightsList.length > 0 && (
          <section className="grid gap-6 xl:grid-cols-[1fr]">
            <AIInsightsCard insights={aiInsightsList} maxDisplay={5} />
          </section>
        )}

        {/* AI Recommendations Section */}
        {recommendations.length > 0 && (
          <section className="grid gap-6 xl:grid-cols-[1fr]">
            <RecommendationsCard recommendations={recommendations} maxDisplay={5} />
          </section>
        )}

        <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <Card className="overflow-hidden">
            <CardContent className="grid gap-5 p-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(260px,.88fr)]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-[8px] bg-[var(--panel-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                    {t("dashboard.heroBadge")}
                  </div>
                  <h2 className="max-w-3xl font-heading text-[2rem] font-semibold leading-[1.02] tracking-[-0.06em] text-[var(--ink)] xl:text-[2.3rem]">
                    {t("dashboard.heroLine1")} {t("dashboard.heroLine2")}
                  </h2>
                  <p className="max-w-2xl text-sm leading-7 text-[var(--ink-soft)] xl:text-[15px]">
                    {t("dashboard.heroDescription")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setProjectModalOpen(true)}>
                    {t("action.addProject")}
                  </Button>
                  <Button onClick={() => setTaskModalOpen(true)} variant="outline">
                    {t("action.addTask")}
                  </Button>
                  <Link className={buttonVariants({ variant: "outline" })} href="/projects">
                    {t("action.openPortfolio")}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <Button
                    variant="secondary"
                    onClick={() => downloadProjectsCsv(projects)}
                  >
                    {t("action.exportExcel")}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => downloadDashboardPdf(projects, tasks, risks, team)}
                  >
                    {t("action.exportPdf") || "PDF"}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-[var(--ink-soft)]">{t("dashboard.kpi.budgetUsed")}</p>
                    <Badge variant={budgetUsed > 75 ? "warning" : "success"}>{budgetUsed}%</Badge>
                  </div>
                  <p className="mt-4 font-heading text-[2.75rem] font-semibold tracking-[-0.08em] text-[var(--ink)]">
                    {totalActual.toLocaleString(locale === "zh" ? "zh-CN" : locale)} ₽
                  </p>
                  <div className="mt-4">
                    <Progress value={budgetUsed} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
                    {t("dashboard.kpi.budgetUsedDescription")}
                  </p>
                </div>
                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-5">
                  <p className="text-sm text-[var(--ink-soft)]">{t("dashboard.nextDecisionWindow")}</p>
                  <div className="mt-4 grid gap-3">
                    {nextMilestones.map((project) => (
                      <div
                        key={project.id}
                        className="rounded-[10px] border border-[var(--line)] bg-[color:var(--surface-panel)] px-4 py-3"
                      >
                        <p className="font-medium text-[var(--ink)]">{project.nextMilestone?.name}</p>
                        <p className="mt-1 text-sm text-[var(--ink-soft)]">
                          {project.name} •{" "}
                          {formatDateLocalized(
                            project.nextMilestone?.date ?? project.dates.end,
                            "d MMM yyyy"
                          )}
                        </p>
                      </div>
                    ))}
                    {!nextMilestones.length ? (
                      <p className="text-sm text-[var(--ink-muted)]">
                        {t("dashboard.portfolioHealthAverage")}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.executiveNotes")}</CardTitle>
              <CardDescription>{t("dashboard.executiveNotesDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {topDocuments.map((document) => (
                <div
                  key={document.id}
                  className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--ink)]">{document.title}</p>
                      <p className="mt-1 text-sm text-[var(--ink-soft)]">
                        {document.type} • {document.size} • {document.owner}
                      </p>
                    </div>
                    <FileText className="h-5 w-5 text-[var(--ink-muted)]" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <AIContextActions />

        <section className="grid gap-6 2xl:grid-cols-[1.12fr_.88fr]">
          <div className="grid gap-6">
            <Card>
              <CardHeader className="flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle>{t("dashboard.projectsGrid")}</CardTitle>
                  <CardDescription>{t("dashboard.projectsGridDescription")}</CardDescription>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    className={fieldStyles}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as "all" | Project["status"])
                    }
                    value={statusFilter}
                  >
                    <option value="all">{t("filters.allStatuses")}</option>
                    <option value="active">{enumLabel("projectStatus", "active")}</option>
                    <option value="planning">{enumLabel("projectStatus", "planning")}</option>
                    <option value="at-risk">{enumLabel("projectStatus", "at-risk")}</option>
                    <option value="completed">{enumLabel("projectStatus", "completed")}</option>
                    <option value="on-hold">{enumLabel("projectStatus", "on-hold")}</option>
                  </select>
                  <select
                    className={fieldStyles}
                    onChange={(event) =>
                      setDirectionFilter(event.target.value as "all" | Project["direction"])
                    }
                    value={directionFilter}
                  >
                    <option value="all">{t("filters.allDirections")}</option>
                    {(["metallurgy", "logistics", "trade", "construction"] as const).map((value) => (
                      <option key={value} value={value}>
                        {enumLabel("direction", value)}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 xl:grid-cols-2">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    onDuplicate={duplicateProject}
                    onEdit={setEditingProject}
                    project={project}
                    taskCount={
                      tasks.filter(
                        (task) => task.projectId === project.id && task.status !== "done"
                      ).length
                    }
                  />
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t("dashboard.progressVsBudget")}</CardTitle>
                  <CardDescription>{t("dashboard.progressVsBudgetDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ClientChart className="h-[320px]">
                    <DashboardTrendChart data={trendData} />
                  </ClientChart>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("dashboard.budgetVariance")}</CardTitle>
                  <CardDescription>{t("dashboard.budgetVarianceDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ClientChart className="h-[320px]">
                    <DashboardBudgetChart data={budgetData} />
                  </ClientChart>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.criticalFeed")}</CardTitle>
                <CardDescription>{t("dashboard.criticalFeedDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {notifications.slice(0, 5).map((notification) => (
                  <Link
                    key={notification.id}
                    className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 transition hover:bg-[color:var(--surface-panel-strong)]"
                    href={notification.projectId ? `/projects/${notification.projectId}` : "/"}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--ink)]">{notification.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">
                          {notification.description}
                        </p>
                      </div>
                      <AlertTriangle className="h-5 w-5 text-rose-500" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.teamLoad")}</CardTitle>
                <CardDescription>{t("dashboard.teamLoadDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {team.slice(0, 4).map((member) => (
                  <div key={member.id} className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--ink)]">{member.name}</p>
                        <p className="text-sm text-[var(--ink-soft)]">{member.role}</p>
                      </div>
                      <Badge
                        variant={
                          member.allocated >= 85
                            ? "danger"
                            : member.allocated >= 70
                              ? "warning"
                              : "success"
                        }
                      >
                        {member.allocated}%
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <Progress value={member.allocated} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.riskMix")}</CardTitle>
                <CardDescription>{t("dashboard.riskMixDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-[.95fr_1.05fr]">
                <ClientChart className="h-[180px]">
                  <DashboardRiskChart data={riskData} />
                </ClientChart>
                <div className="grid gap-3">
                  {riskData.map((entry) => (
                    <div
                      key={entry.name}
                      className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="font-medium text-[var(--ink)]">{entry.name}</span>
                        </div>
                        <span className="font-heading text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
                          {entry.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      <ProjectFormModal
        open={projectModalOpen}
        onOpenChange={setProjectModalOpen}
      />
      <ProjectFormModal
        open={Boolean(editingProject)}
        onOpenChange={(open) => {
          if (!open) setEditingProject(null);
        }}
        project={editingProject}
      />
      <TaskFormModal open={taskModalOpen} onOpenChange={setTaskModalOpen} />
      {kpiModalState && (
        <KpiDetailModal
          open={kpiModalState.open}
          onOpenChange={(open) => {
            if (!open) setKpiModalState(null);
          }}
          title={kpiModalState.title}
          value={kpiModalState.value}
          description={kpiModalState.description}
          icon={kpiModalState.icon}
          tone={kpiModalState.tone}
          breakdown={kpiModalState.breakdown}
          actions={kpiModalState.actions}
        />
      )}
    </>
  );
}
