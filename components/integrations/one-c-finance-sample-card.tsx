import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OneCFinanceSampleSnapshot } from "@/lib/connectors/one-c-client";

function statusVariant(status: OneCFinanceSampleSnapshot["status"]) {
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

function formatVariance(value: number | null, percent: number | null, currency: string | null) {
  if (value === null) {
    return "Unavailable";
  }

  const amount = formatAmount(value, currency);

  if (percent === null) {
    return amount;
  }

  return `${amount} (${Math.round(percent * 100)}%)`;
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

export function OneCFinanceSampleCard({
  snapshot,
}: {
  snapshot: OneCFinanceSampleSnapshot;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>1C financial sample</CardTitle>
            <CardDescription>
              Первый live read-only slice поверх 1C. Он показывает project finance facts без write-back семантики и без притворного ERP coverage.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={statusVariant(snapshot.status)}>{snapshot.status}</Badge>
            <Badge variant={snapshot.configured ? "success" : "warning"}>
              {snapshot.configured ? "Configured" : "Secrets missing"}
            </Badge>
            <Badge variant={snapshot.samples.length > 0 ? "info" : "warning"}>
              {snapshot.samples.length} project{snapshot.samples.length === 1 ? "" : "s"}
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
              <div className="font-medium text-[var(--ink)]">Sample endpoint</div>
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

        {snapshot.samples.length > 0 ? (
          <div className="grid gap-3">
            {snapshot.samples.map((sample, index) => (
              <div
                className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
                key={sample.projectId ?? `${sample.projectName ?? "project"}:${index}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--ink)]">
                      {sample.projectName ?? sample.projectId ?? "Unknown project"}
                    </div>
                    <div className="mt-1 text-xs text-[var(--ink-soft)]">
                      {sample.projectId ?? "Project ref unavailable"}
                    </div>
                  </div>
                  <Badge variant="info">{sample.status}</Badge>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-[var(--ink-soft)]">
                  <div>Report date: {formatDate(sample.reportDate)}</div>
                  <div>Planned budget: {formatAmount(sample.plannedBudget, sample.currency)}</div>
                  <div>Actual budget: {formatAmount(sample.actualBudget, sample.currency)}</div>
                  <div>Payments actual: {formatAmount(sample.paymentsActual, sample.currency)}</div>
                  <div>Acts actual: {formatAmount(sample.actsActual, sample.currency)}</div>
                  <div>Variance: {formatVariance(sample.variance, sample.variancePercent, sample.currency)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
