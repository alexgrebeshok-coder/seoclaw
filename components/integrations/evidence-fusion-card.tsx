import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EvidenceFusionFactView, EvidenceFusionOverview } from "@/lib/evidence";

function statusVariant(status: EvidenceFusionFactView["verificationStatus"]) {
  switch (status) {
    case "verified":
      return "success";
    case "observed":
      return "info";
    case "reported":
    default:
      return "warning";
  }
}

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function EvidenceFusionCard({
  fusion,
}: {
  fusion: EvidenceFusionOverview;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>Cross-source confidence fusion</CardTitle>
            <CardDescription>
              Этот слой объясняет, когда work report подтверждён только словами, а когда его дополнительно поддерживают GPS telemetry и linked visual evidence.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="warning">Reported {fusion.summary.reported}</Badge>
            <Badge variant="info">Observed {fusion.summary.observed}</Badge>
            <Badge variant="success">Verified {fusion.summary.verified}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-4">
        <div className="grid gap-3 rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 text-sm text-[var(--ink-soft)] sm:grid-cols-3">
          <div>
            <div className="font-medium text-[var(--ink)]">Fused facts</div>
            <div className="mt-1">{fusion.summary.total}</div>
          </div>
          <div>
            <div className="font-medium text-[var(--ink)]">Average rollup confidence</div>
            <div className="mt-1">
              {fusion.summary.averageConfidence !== null
                ? formatConfidence(fusion.summary.averageConfidence)
                : "Unavailable"}
            </div>
          </div>
          <div>
            <div className="font-medium text-[var(--ink)]">Strongest fact</div>
            <div className="mt-1 truncate">{fusion.summary.strongestFactTitle ?? "Unavailable"}</div>
          </div>
        </div>

        {fusion.facts.length > 0 ? (
          <div className="grid gap-3">
            {fusion.facts.map((fact) => (
              <div
                className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
                key={fact.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--ink)]">{fact.title}</div>
                    <div className="mt-1 text-xs text-[var(--ink-soft)]">
                      {fact.projectName ?? "No project"} · {fact.reportNumber ?? fact.reportId}
                      {fact.section ? ` · ${fact.section}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={statusVariant(fact.verificationStatus)}>
                      {fact.verificationStatus}
                    </Badge>
                    <Badge variant="info">{formatConfidence(fact.confidence)}</Badge>
                    <Badge variant="neutral">{fact.sourceCount} sources</Badge>
                  </div>
                </div>

                <div className="mt-3 text-sm text-[var(--ink-soft)]">{fact.explanation}</div>

                <div className="mt-3 grid gap-2 text-xs text-[var(--ink-soft)]">
                  <div>Observed: {formatTimestamp(fact.observedAt)}</div>
                  <div>Report date: {formatTimestamp(fact.reportDate)}</div>
                </div>

                <div className="mt-4 grid gap-2">
                  {fact.sources.map((source) => (
                    <div
                      className="flex flex-wrap items-start justify-between gap-3 rounded-[14px] border border-[var(--line)]/70 bg-[var(--surface)]/70 px-3 py-2 text-sm"
                      key={source.recordId}
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--ink)]">{source.title}</div>
                        <div className="mt-1 text-xs text-[var(--ink-soft)]">
                          {source.entityType} · {source.sourceType}
                        </div>
                        <div className="mt-1 text-xs text-[var(--ink-soft)]">
                          Match: {source.matchReasons.join(", ")}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={statusVariant(source.verificationStatus)}>
                          {source.verificationStatus}
                        </Badge>
                        <Badge variant="info">{formatConfidence(source.confidence)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[16px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] p-4 text-sm text-[var(--ink-soft)]">
            Пока нет fused facts. Нужны work reports и хотя бы один corroborating source, например linked video fact или matching GPS telemetry.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
