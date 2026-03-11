import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatObservationType } from "@/lib/video-facts/service";
import type { VideoFactListResult, VideoFactView } from "@/lib/video-facts/types";

function statusVariant(status: VideoFactView["verificationStatus"]) {
  switch (status) {
    case "verified":
      return "success";
    case "observed":
    default:
      return "info";
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

export function VideoFactSummaryCard({
  videoFacts,
}: {
  videoFacts: VideoFactListResult;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>Video fact summary</CardTitle>
            <CardDescription>
              Первый visual evidence loop: metadata intake плюс узкое правило verification against approved work reports from the same reporting day.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">Observed {videoFacts.summary.observed}</Badge>
            <Badge variant="success">Verified {videoFacts.summary.verified}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 text-sm text-[var(--ink-soft)] sm:grid-cols-3">
          <div>
            <div className="font-medium text-[var(--ink)]">Visual facts</div>
            <div className="mt-1">{videoFacts.summary.total}</div>
          </div>
          <div>
            <div className="font-medium text-[var(--ink)]">Average confidence</div>
            <div className="mt-1">
              {videoFacts.summary.averageConfidence !== null
                ? formatConfidence(videoFacts.summary.averageConfidence)
                : "Unavailable"}
            </div>
          </div>
          <div>
            <div className="font-medium text-[var(--ink)]">Latest capture</div>
            <div className="mt-1">{formatTimestamp(videoFacts.summary.lastCapturedAt)}</div>
          </div>
        </div>

        {videoFacts.items.length > 0 ? (
          <div className="grid gap-3">
            {videoFacts.items.map((item) => (
              <div
                className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
                key={item.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--ink)]">{item.title}</div>
                    <div className="mt-1 text-xs text-[var(--ink-soft)]">
                      {item.projectName ?? "Unknown project"}
                      {item.reportNumber ? ` · ${item.reportNumber}` : ""}
                      {item.section ? ` · ${item.section}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="info">{formatObservationType(item.observationType)}</Badge>
                    <Badge variant={statusVariant(item.verificationStatus)}>
                      {item.verificationStatus}
                    </Badge>
                    <Badge variant="info">{formatConfidence(item.confidence)}</Badge>
                  </div>
                </div>

                {item.summary ? (
                  <div className="mt-3 text-sm text-[var(--ink-soft)]">{item.summary}</div>
                ) : null}

                <div className="mt-3 grid gap-2 text-xs text-[var(--ink-soft)] md:grid-cols-2 xl:grid-cols-4">
                  <div>Captured: {formatTimestamp(item.capturedAt)}</div>
                  <div>Reported: {formatTimestamp(item.reportedAt)}</div>
                  <div>Report status: {item.reportStatus ?? "n/a"}</div>
                  <div>
                    URL:{" "}
                    {item.url ? (
                      <a
                        className="text-[var(--brand)] underline-offset-2 hover:underline"
                        href={item.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        open
                      </a>
                    ) : (
                      "n/a"
                    )}
                  </div>
                </div>

                {item.verificationRule ? (
                  <div className="mt-3 text-xs text-[var(--ink-soft)]">
                    Verification rule: {item.verificationRule}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[16px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] p-4 text-sm text-[var(--ink-soft)]">
            Пока нет visual facts. Добавьте video reference, связанный с work report.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
