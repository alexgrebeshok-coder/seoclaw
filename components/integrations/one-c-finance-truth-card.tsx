import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OneCFinanceTruthSnapshot } from "@/lib/connectors/one-c-client";

function statusVariant(status: OneCFinanceTruthSnapshot["status"]) {
  switch (status) {
    case "ok":
      return "success";
    case "degraded":
      return "danger";
    case "pending":
    default:
      return "warning";
  }
}

function budgetDeltaVariant(status: "on_plan" | "over_plan" | "under_plan" | "unknown") {
  switch (status) {
    case "over_plan":
      return "danger";
    case "under_plan":
      return "success";
    case "on_plan":
      return "info";
    case "unknown":
    default:
      return "warning";
  }
}

function formatAmount(value: number | null, currency: string | null) {
  if (value === null) {
    return "Unavailable";
  }

  if (currency) {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }

  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDelta(value: number | null, currency: string | null) {
  if (value === null) {
    return "Unavailable";
  }

  const amount = formatAmount(Math.abs(value), currency);
  if (value === 0) {
    return amount;
  }

  return value > 0 ? `+${amount}` : `-${amount}`;
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "Unavailable";
  }

  return `${Math.round(value * 100)}%`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">{label}</div>
      <div className="mt-2 text-lg font-semibold text-[var(--ink)]">{value}</div>
    </div>
  );
}

function getBudgetDeltaLabel(status: "on_plan" | "over_plan" | "under_plan" | "unknown") {
  switch (status) {
    case "over_plan":
      return "Over plan";
    case "under_plan":
      return "Under plan";
    case "on_plan":
      return "On plan";
    case "unknown":
    default:
      return "Delta unknown";
  }
}

export function OneCFinanceTruthCard({
  snapshot,
}: {
  snapshot: OneCFinanceTruthSnapshot;
}) {
  const topProjects = snapshot.projects.slice(0, 4);
  const summaryCurrency = snapshot.projects[0]?.currency ?? null;

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>1C financial truth</CardTitle>
            <CardDescription>
              Read-only 1C truth slice с нормализованными project deltas. Здесь видны explainable budget, payment и acts gaps без притворного ERP mirror и без write-back.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={statusVariant(snapshot.status)}>{snapshot.status}</Badge>
            <Badge variant={snapshot.configured ? "success" : "warning"}>
              {snapshot.configured ? "Configured" : "Secrets missing"}
            </Badge>
            <Badge variant={snapshot.summary.projectCount > 0 ? "info" : "warning"}>
              {snapshot.summary.projectCount} project
              {snapshot.summary.projectCount === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-4">
        <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 text-sm">
          <div className="font-medium text-[var(--ink)]">Connector message</div>
          <div className="mt-1 text-[var(--ink-soft)]">{snapshot.message}</div>
          {snapshot.sampleUrl ? (
            <div className="mt-3">
              <div className="font-medium text-[var(--ink)]">Finance endpoint</div>
              <code className="mt-1 block break-all text-xs text-[var(--ink-soft)]">
                {snapshot.sampleUrl}
              </code>
            </div>
          ) : null}
          {snapshot.missingSecrets.length > 0 ? (
            <div className="mt-3 text-xs text-[var(--ink-soft)]">
              Missing secrets: {snapshot.missingSecrets.join(", ")}
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryMetric
            label="Over plan"
            value={`${snapshot.summary.overPlanCount} project${snapshot.summary.overPlanCount === 1 ? "" : "s"}`}
          />
          <SummaryMetric
            label="Under plan"
            value={`${snapshot.summary.underPlanCount} project${snapshot.summary.underPlanCount === 1 ? "" : "s"}`}
          />
          <SummaryMetric
            label="On plan"
            value={`${snapshot.summary.onPlanCount} project${snapshot.summary.onPlanCount === 1 ? "" : "s"}`}
          />
          <SummaryMetric
            label="Planned budget"
            value={formatAmount(snapshot.summary.totalPlannedBudget, summaryCurrency)}
          />
          <SummaryMetric
            label="Actual budget"
            value={formatAmount(snapshot.summary.totalActualBudget, summaryCurrency)}
          />
          <SummaryMetric
            label="Budget variance"
            value={formatDelta(snapshot.summary.totalBudgetVariance, summaryCurrency)}
          />
          <SummaryMetric
            label="Actual vs payments gap"
            value={formatDelta(snapshot.summary.totalPaymentGap, summaryCurrency)}
          />
          <SummaryMetric
            label="Actual vs acts gap"
            value={formatDelta(snapshot.summary.totalActGap, summaryCurrency)}
          />
          <SummaryMetric
            label="Observed reports"
            value={`${snapshot.projects.filter((project) => project.observedAt !== null).length}`}
          />
        </div>

        <div className="grid gap-3">
          <div className="text-sm font-medium text-[var(--ink)]">Project financial deltas</div>
          {topProjects.length > 0 ? (
            topProjects.map((project) => (
              <div
                className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
                key={project.projectKey}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--ink)]">
                      {project.projectName ?? project.projectId ?? project.projectKey}
                    </div>
                    <div className="mt-1 text-xs text-[var(--ink-soft)]">
                      {project.projectId ?? "Project ref unavailable"}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="info">{project.status}</Badge>
                    <Badge variant={budgetDeltaVariant(project.budgetDeltaStatus)}>
                      {getBudgetDeltaLabel(project.budgetDeltaStatus)}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-[var(--ink-soft)]">
                  <div>Report date: {formatDate(project.reportDate)}</div>
                  <div>
                    Planned vs actual: {formatAmount(project.plannedBudget, project.currency)} /{" "}
                    {formatAmount(project.actualBudget, project.currency)}
                  </div>
                  <div>
                    Budget variance: {formatDelta(project.variance, project.currency)} (
                    {formatPercent(project.variancePercent)})
                  </div>
                  <div>Actual-to-plan ratio: {formatPercent(project.actualToPlanRatio)}</div>
                  <div>
                    Payments vs actual: {formatAmount(project.paymentsActual, project.currency)} /{" "}
                    {formatAmount(project.actualBudget, project.currency)}
                  </div>
                  <div>
                    Payment gap: {formatDelta(project.paymentGap, project.currency)} (
                    {formatPercent(project.paymentsToActualRatio)})
                  </div>
                  <div>
                    Acts gap: {formatDelta(project.actGap, project.currency)} (
                    {formatPercent(project.actsToActualRatio)})
                  </div>
                  <div>
                    Payments vs acts gap:{" "}
                    {formatDelta(project.paymentsVsActsGap, project.currency)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[16px] border border-dashed border-[var(--line)] p-4 text-sm text-[var(--ink-soft)]">
              No normalized 1C finance records were derived from the current provider payload.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
