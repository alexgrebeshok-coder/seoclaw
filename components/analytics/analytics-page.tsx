"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { useDashboard } from "@/components/dashboard-provider";
import { ClientChart } from "@/components/ui/client-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fieldStyles } from "@/components/ui/field";
import { ChartSkeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/contexts/locale-context";
import { formatCurrency } from "@/lib/utils";

const AnalyticsTrendChart = dynamic(
  () =>
    import("@/components/analytics/analytics-trend-chart").then(
      (module) => module.AnalyticsTrendChart
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

const AnalyticsHealthChart = dynamic(
  () =>
    import("@/components/analytics/analytics-health-chart").then(
      (module) => module.AnalyticsHealthChart
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

const AnalyticsBudgetChart = dynamic(
  () =>
    import("@/components/analytics/analytics-budget-chart").then(
      (module) => module.AnalyticsBudgetChart
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

export function AnalyticsPage() {
  const { t } = useLocale();
  const { projects, team } = useDashboard();
  const [period, setPeriod] = useState("90d");

  const portfolioHealthData = projects.map((project) => ({
    name: project.name.split(" ")[0],
    health: project.health,
    budgetVariance: Math.round(((project.budget.actual - project.budget.planned) / project.budget.planned) * 100),
  }));

  const progressTrend = projects[0]?.history.map((point, index) => ({
    name: point.date.slice(5),
    progress: Math.round(
      projects.reduce((sum, project) => sum + (project.history[index]?.progress ?? project.progress), 0) /
        projects.length
    ),
    spend: Math.round(
      projects.reduce((sum, project) => sum + (project.history[index]?.budgetActual ?? project.budget.actual), 0) /
        1000
    ),
  })) ?? [];

  const healthMix = [
    {
      name: t("analytics.mixHealthy"),
      value: projects.filter((project) => project.health >= 75).length,
      color: "#10b981",
    },
    {
      name: t("analytics.mixAttention"),
      value: projects.filter((project) => project.health >= 60 && project.health < 75).length,
      color: "#f59e0b",
    },
    {
      name: t("analytics.mixCritical"),
      value: projects.filter((project) => project.health < 60).length,
      color: "#fb7185",
    },
  ];

  const utilization = team.map((member) => ({
    name: member.name,
    allocated: member.allocated,
  }));

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>{t("analytics.title")}</CardTitle>
            <CardDescription>
              {t("analytics.description")}
            </CardDescription>
          </div>
          <select className={fieldStyles} onChange={(event) => setPeriod(event.target.value)} value={period}>
            <option value="30d">{t("analytics.period30d")}</option>
            <option value="90d">{t("analytics.period90d")}</option>
            <option value="180d">{t("analytics.period180d")}</option>
          </select>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.trendline")}</CardTitle>
            <CardDescription>{t("analytics.trendlineDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ClientChart className="h-[340px]">
              <AnalyticsTrendChart data={progressTrend} />
            </ClientChart>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.healthMix")}</CardTitle>
            <CardDescription>{t("analytics.healthMixDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[.95fr_1.05fr]">
            <ClientChart className="h-[260px]">
              <AnalyticsHealthChart data={healthMix} />
            </ClientChart>
            <div className="grid gap-3">
              {healthMix.map((entry) => (
                <div
                  key={entry.name}
                  className="rounded-[8px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
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

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.budgetVariance")}</CardTitle>
            <CardDescription>{t("analytics.budgetVarianceDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ClientChart className="h-[320px]">
              <AnalyticsBudgetChart data={portfolioHealthData} />
            </ClientChart>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.resourceUtilization")}</CardTitle>
            <CardDescription>{t("analytics.resourceUtilizationDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {utilization.map((member) => (
              <div
                key={member.name}
                className="rounded-[8px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-[var(--ink)]">{member.name}</span>
                  <span className="text-sm text-[var(--ink-soft)]">{member.allocated}%</span>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-[var(--panel-soft-strong)] dark:bg-[#3a3a3a]">
                  <div
                    className="h-full rounded-full bg-[var(--brand)]"
                    style={{ width: `${member.allocated}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.financialSnapshot")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-[8px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
            >
              <p className="font-medium text-[var(--ink)]">{project.name}</p>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                {t("analytics.planned")}:{" "}
                {formatCurrency(project.budget.planned, project.budget.currency)}
              </p>
              <p className="text-sm text-[var(--ink-soft)]">
                {t("analytics.actual")}:{" "}
                {formatCurrency(project.budget.actual, project.budget.currency)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
