import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { GpsTelemetryTruthSnapshot } from "@/lib/connectors/gps-client";

function statusVariant(status: GpsTelemetryTruthSnapshot["status"]) {
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

function formatDuration(durationSeconds: number | null) {
  if (durationSeconds === null) {
    return "Unavailable";
  }

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.round((durationSeconds % 3600) / 60);

  if (hours <= 0) {
    return `${minutes} min`;
  }

  return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
}

function formatRange(startedAt: string | null, endedAt: string | null) {
  if (!startedAt && !endedAt) {
    return "Time range unavailable";
  }

  return [startedAt ?? "?", endedAt ?? "?"].join(" -> ");
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Unavailable";
  }

  return value.replace("T", " ").replace(".000Z", "Z");
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

export function GpsTelemetryTruthCard({
  snapshot,
}: {
  snapshot: GpsTelemetryTruthSnapshot;
}) {
  const topEquipment = snapshot.equipment.slice(0, 3);
  const topGeofences = snapshot.geofences.slice(0, 3);
  const recentSessions = snapshot.sessions.slice(0, 4);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>GPS telemetry truth</CardTitle>
            <CardDescription>
              Read-only normalized telemetry slice поверх live GPS API: operator видит не только sample, но и deterministic session, equipment и geofence truth.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={statusVariant(snapshot.status)}>{snapshot.status}</Badge>
            <Badge variant={snapshot.configured ? "success" : "warning"}>
              {snapshot.configured ? "Configured" : "Secrets missing"}
            </Badge>
            <Badge variant={snapshot.summary.sessionCount > 0 ? "info" : "warning"}>
              {snapshot.summary.sessionCount} session
              {snapshot.summary.sessionCount === 1 ? "" : "s"}
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
              <div className="font-medium text-[var(--ink)]">Telemetry endpoint</div>
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
            label="Linked equipment"
            value={`${snapshot.summary.equipmentCount} entities`}
          />
          <SummaryMetric
            label="Linked geofences"
            value={`${snapshot.summary.geofenceCount} entities`}
          />
          <SummaryMetric
            label="Observed duration"
            value={formatDuration(snapshot.summary.totalDurationSeconds)}
          />
          <SummaryMetric
            label="Open-ended sessions"
            value={String(snapshot.summary.openEndedSessionCount)}
          />
          <SummaryMetric
            label="Equipment-linked"
            value={`${snapshot.summary.equipmentLinkedSessions}/${snapshot.summary.sessionCount || 0}`}
          />
          <SummaryMetric
            label="Geofence-linked"
            value={`${snapshot.summary.geofenceLinkedSessions}/${snapshot.summary.sessionCount || 0}`}
          />
        </div>

        <div className="grid gap-3">
          <div className="text-sm font-medium text-[var(--ink)]">Equipment truth</div>
          {topEquipment.length > 0 ? (
            topEquipment.map((equipment) => (
              <div
                className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
                key={equipment.equipmentKey}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--ink)]">
                      {equipment.equipmentId ?? equipment.equipmentKey}
                    </div>
                    <div className="mt-1 text-xs text-[var(--ink-soft)]">
                      {equipment.equipmentType ?? "Equipment type unavailable"}
                    </div>
                  </div>
                  <Badge variant="info">
                    {equipment.sessionCount} session
                    {equipment.sessionCount === 1 ? "" : "s"}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-[var(--ink-soft)]">
                  <div>Total duration: {formatDuration(equipment.totalDurationSeconds)}</div>
                  <div>Latest status: {equipment.latestStatus ?? "Unavailable"}</div>
                  <div>Latest observed: {formatTimestamp(equipment.latestObservedAt)}</div>
                  <div>
                    Latest geofence:{" "}
                    {equipment.latestGeofenceName ?? equipment.latestGeofenceKey ?? "Unavailable"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[16px] border border-dashed border-[var(--line)] p-4 text-sm text-[var(--ink-soft)]">
              Equipment-linked truth will appear as soon as the provider returns session records with identifiable assets.
            </div>
          )}
        </div>

        <div className="grid gap-3">
          <div className="text-sm font-medium text-[var(--ink)]">Geofence truth</div>
          {topGeofences.length > 0 ? (
            topGeofences.map((geofence) => (
              <div
                className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
                key={geofence.geofenceKey}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--ink)]">
                      {geofence.geofenceName ?? geofence.geofenceId ?? geofence.geofenceKey}
                    </div>
                    <div className="mt-1 text-xs text-[var(--ink-soft)]">
                      {geofence.geofenceId ?? "Geofence id unavailable"}
                    </div>
                  </div>
                  <Badge variant="info">
                    {geofence.equipmentCount} equipment
                    {geofence.equipmentCount === 1 ? "" : "s"}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-[var(--ink-soft)]">
                  <div>Sessions: {geofence.sessionCount}</div>
                  <div>Total duration: {formatDuration(geofence.totalDurationSeconds)}</div>
                  <div>Latest observed: {formatTimestamp(geofence.latestObservedAt)}</div>
                  <div>
                    Equipment ids:{" "}
                    {geofence.equipmentIds.length > 0
                      ? geofence.equipmentIds.join(", ")
                      : "Unavailable"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[16px] border border-dashed border-[var(--line)] p-4 text-sm text-[var(--ink-soft)]">
              Geofence-linked truth is not yet present in the returned telemetry payload.
            </div>
          )}
        </div>

        <div className="grid gap-3">
          <div className="text-sm font-medium text-[var(--ink)]">Recent normalized sessions</div>
          {recentSessions.length > 0 ? (
            recentSessions.map((session) => (
              <div
                className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
                key={session.sessionKey}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--ink)]">
                      {session.equipmentId ?? "Unknown equipment"}
                    </div>
                    <div className="mt-1 text-xs text-[var(--ink-soft)]">
                      {session.sessionId ?? session.sessionKey}
                    </div>
                  </div>
                  <Badge variant="info">{session.status}</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-[var(--ink-soft)]">
                  <div>Range: {formatRange(session.startedAt, session.endedAt)}</div>
                  <div>Observed at: {formatTimestamp(session.observedAt)}</div>
                  <div>Duration: {formatDuration(session.durationSeconds)}</div>
                  <div>
                    Geofence: {session.geofenceName ?? session.geofenceId ?? "Unavailable"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[16px] border border-dashed border-[var(--line)] p-4 text-sm text-[var(--ink-soft)]">
              No normalized GPS sessions were derived from the current provider payload.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
