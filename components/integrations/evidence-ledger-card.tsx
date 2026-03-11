import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EvidenceListResult, EvidenceRecordView } from "@/lib/evidence";

function statusVariant(status: EvidenceRecordView["verificationStatus"]) {
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

export function EvidenceLedgerCard({
  evidence,
}: {
  evidence: EvidenceListResult;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>Evidence ledger</CardTitle>
            <CardDescription>
              Первый provenance-слой поверх work reports, GPS sample и visual facts. Он разделяет `reported`, `observed` и `verified` факты в одной operator view.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="warning">Reported {evidence.summary.reported}</Badge>
            <Badge variant="info">Observed {evidence.summary.observed}</Badge>
            <Badge variant="success">Verified {evidence.summary.verified}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-4">
        <div className="grid gap-3 rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 text-sm text-[var(--ink-soft)] sm:grid-cols-3">
          <div>
            <div className="font-medium text-[var(--ink)]">Synced at</div>
            <div className="mt-1">{formatTimestamp(evidence.syncedAt)}</div>
          </div>
          <div>
            <div className="font-medium text-[var(--ink)]">Average confidence</div>
            <div className="mt-1">
              {evidence.summary.averageConfidence !== null
                ? formatConfidence(evidence.summary.averageConfidence)
                : "Unavailable"}
            </div>
          </div>
          <div>
            <div className="font-medium text-[var(--ink)]">Last observed fact</div>
            <div className="mt-1">{formatTimestamp(evidence.summary.lastObservedAt)}</div>
          </div>
        </div>

        {evidence.records.length > 0 ? (
          <div className="grid gap-3">
            {evidence.records.map((record) => (
              <div
                className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
                key={record.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--ink)]">{record.title}</div>
                    <div className="mt-1 text-xs text-[var(--ink-soft)]">
                      {record.entityType} · {record.sourceType}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={statusVariant(record.verificationStatus)}>
                      {record.verificationStatus}
                    </Badge>
                    <Badge variant="info">{formatConfidence(record.confidence)}</Badge>
                  </div>
                </div>

                {record.summary ? (
                  <div className="mt-3 text-sm text-[var(--ink-soft)]">{record.summary}</div>
                ) : null}

                <div className="mt-3 grid gap-2 text-xs text-[var(--ink-soft)]">
                  <div>Observed: {formatTimestamp(record.observedAt)}</div>
                  <div>Reported: {formatTimestamp(record.reportedAt)}</div>
                  <div>Entity ref: {record.entityRef}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[16px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] p-4 text-sm text-[var(--ink-soft)]">
            Пока нет evidence records. Добавьте work reports или настройте live GPS sample.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
