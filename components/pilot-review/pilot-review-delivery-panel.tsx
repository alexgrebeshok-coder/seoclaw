"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, fieldStyles } from "@/components/ui/field";
import type { BriefDeliveryLedgerRecord } from "@/lib/briefs/delivery-ledger";
import type {
  PilotReviewDeliveryPolicyExecutionSummary,
  PilotReviewDeliveryPolicyRecord,
} from "@/lib/pilot-review";

interface DeliveryStatePayload {
  history: BriefDeliveryLedgerRecord[];
  policies: PilotReviewDeliveryPolicyRecord[];
}

interface DeliveryStateErrorPayload {
  error?: {
    message?: string;
  };
}

const weekdayOptions = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function deliveryStatusVariant(status: BriefDeliveryLedgerRecord["status"]) {
  switch (status) {
    case "delivered":
      return "success";
    case "failed":
      return "danger";
    case "pending":
      return "warning";
    case "preview":
    default:
      return "info";
  }
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) {
    return "Not yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPolicySchedule(policy: PilotReviewDeliveryPolicyRecord) {
  const weekdayLabel =
    weekdayOptions.find((option) => option.value === policy.deliveryWeekday)?.label ??
    `Day ${policy.deliveryWeekday}`;
  return `${weekdayLabel} at ${String(policy.deliveryHour).padStart(2, "0")}:00 ${policy.timezone}`;
}

export function PilotReviewDeliveryPanel({
  availabilityNote,
  initialHistory,
  initialPolicies,
}: {
  availabilityNote?: string;
  initialHistory: BriefDeliveryLedgerRecord[];
  initialPolicies: PilotReviewDeliveryPolicyRecord[];
}) {
  const [policies, setPolicies] = useState(initialPolicies);
  const [history, setHistory] = useState(initialHistory);
  const [recipient, setRecipient] = useState("");
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  });
  const [deliveryWeekday, setDeliveryWeekday] = useState("1");
  const [deliveryHour, setDeliveryHour] = useState("9");
  const [error, setError] = useState<string | null>(null);
  const [runSummary, setRunSummary] =
    useState<PilotReviewDeliveryPolicyExecutionSummary | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunningDry, setIsRunningDry] = useState(false);
  const [isRunningLive, setIsRunningLive] = useState(false);
  const [togglingPolicyId, setTogglingPolicyId] = useState<string | null>(null);

  async function loadState() {
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/pilot-review/policies", {
        cache: "no-store",
      });
      const payload = (await response.json()) as
        | (DeliveryStatePayload & DeliveryStateErrorPayload)
        | DeliveryStateErrorPayload;

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to load governance delivery state.");
      }

      setPolicies((payload as DeliveryStatePayload).policies ?? []);
      setHistory((payload as DeliveryStatePayload).history ?? []);
      setError(null);
    } catch (loadingError) {
      setError(
        loadingError instanceof Error
          ? loadingError.message
          : "Failed to load governance delivery state."
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  async function createPolicy() {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/pilot-review/policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveryHour: Number(deliveryHour),
          deliveryWeekday: Number(deliveryWeekday),
          recipient: recipient.trim() || null,
          timezone: timezone.trim(),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error?.message ?? "Failed to create governance delivery policy."
        );
      }

      setError(null);
      setRecipient("");
      await loadState();
    } catch (creationError) {
      setError(
        creationError instanceof Error
          ? creationError.message
          : "Failed to create governance delivery policy."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function togglePolicy(policy: PilotReviewDeliveryPolicyRecord) {
    setTogglingPolicyId(policy.id);

    try {
      const response = await fetch(`/api/pilot-review/policies/${policy.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: !policy.active,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error?.message ?? "Failed to update governance delivery policy."
        );
      }

      setPolicies((current) =>
        current.map((entry) =>
          entry.id === policy.id ? (payload as PilotReviewDeliveryPolicyRecord) : entry
        )
      );
      setError(null);
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Failed to update governance delivery policy."
      );
    } finally {
      setTogglingPolicyId(null);
    }
  }

  async function runDue(dryRun: boolean) {
    if (dryRun) {
      setIsRunningDry(true);
    } else {
      setIsRunningLive(true);
    }

    try {
      const response = await fetch("/api/pilot-review/policies/run-due", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dryRun }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error?.message ?? "Failed to run governance delivery schedule."
        );
      }

      setRunSummary(payload as PilotReviewDeliveryPolicyExecutionSummary);
      setError(null);
      await loadState();
    } catch (runError) {
      setError(
        runError instanceof Error
          ? runError.message
          : "Failed to run governance delivery schedule."
      );
    } finally {
      if (dryRun) {
        setIsRunningDry(false);
      } else {
        setIsRunningLive(false);
      }
    }
  }

  const canCreatePolicy =
    !availabilityNote &&
    !isSubmitting &&
    timezone.trim().length > 0 &&
    deliveryHour.trim().length > 0 &&
    deliveryWeekday.trim().length > 0;

  return (
    <div className="grid gap-4 rounded-[18px] border border-[var(--line)] bg-[var(--surface-panel)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-[var(--ink)]">
            Recurring governance delivery
          </div>
          <div className="mt-1 text-xs text-[var(--ink-soft)]">
            Weekly pilot review stays narrow: one email schedule, one due-run trigger, one
            durable delivery ledger.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">Email only</Badge>
          <Badge variant="info">Weekly cadence</Badge>
          <Badge variant="neutral">Cron-safe</Badge>
        </div>
      </div>

      {availabilityNote ? (
        <div className="rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 text-sm text-[var(--ink-soft)]">
          {availabilityNote}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[14px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
          <span>Recipient</span>
          <Input
            onChange={(event) => setRecipient(event.target.value)}
            placeholder="Optional if EMAIL_DEFAULT_TO is configured"
            value={recipient}
          />
        </label>

        <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
          <span>Timezone</span>
          <Input onChange={(event) => setTimezone(event.target.value)} value={timezone} />
        </label>

        <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
          <span>Weekday</span>
          <select
            className={fieldStyles}
            onChange={(event) => setDeliveryWeekday(event.target.value)}
            value={deliveryWeekday}
          >
            {weekdayOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
        <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
          <span>Delivery hour</span>
          <Input
            max={23}
            min={0}
            onChange={(event) => setDeliveryHour(event.target.value)}
            type="number"
            value={deliveryHour}
          />
        </label>
        <div className="grid gap-2 text-xs text-[var(--ink-soft)]">
          <span className="uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Trigger notes
          </span>
          <div>
            `POST /api/pilot-review/policies/run-due` lets an operator preview or execute the
            current due window.
          </div>
          <div>
            `POST /api/pilot-review/policies/run-due/cron` is the bearer-token companion for
            scheduled runners.
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={!canCreatePolicy} onClick={createPolicy}>
          {isSubmitting ? "Saving schedule..." : "Save weekly schedule"}
        </Button>
        <Button
          disabled={Boolean(availabilityNote) || isRunningDry || isRunningLive}
          onClick={() => runDue(true)}
          variant="secondary"
        >
          {isRunningDry ? "Previewing..." : "Preview due run"}
        </Button>
        <Button
          disabled={Boolean(availabilityNote) || isRunningDry || isRunningLive}
          onClick={() => runDue(false)}
          variant="outline"
        >
          {isRunningLive ? "Running..." : "Run due now"}
        </Button>
        <Button
          disabled={Boolean(availabilityNote) || isRefreshing}
          onClick={loadState}
          variant="ghost"
        >
          {isRefreshing ? "Refreshing..." : "Refresh state"}
        </Button>
      </div>

      {runSummary ? (
        <div className="grid gap-3 rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-[var(--ink)]">Latest run outcome</div>
              <div className="mt-1 text-xs text-[var(--ink-soft)]">
                {formatTimestamp(runSummary.timestamp)}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant={runSummary.failedPolicies > 0 ? "danger" : "success"}>
                {runSummary.failedPolicies} failed
              </Badge>
              <Badge variant={runSummary.previewPolicies > 0 ? "info" : "neutral"}>
                {runSummary.previewPolicies} previewed
              </Badge>
              <Badge variant={runSummary.deliveredPolicies > 0 ? "success" : "neutral"}>
                {runSummary.deliveredPolicies} delivered
              </Badge>
              <Badge variant="neutral">{runSummary.skippedPolicies} skipped</Badge>
            </div>
          </div>
          <div className="grid gap-2 text-sm text-[var(--ink-soft)] md:grid-cols-3">
            <div>Checked: {runSummary.checkedPolicies}</div>
            <div>Due: {runSummary.duePolicies}</div>
            <div>Timestamp: {formatTimestamp(runSummary.timestamp)}</div>
          </div>
          <div className="grid gap-2">
            {runSummary.results.map((result) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--surface-panel)] px-3 py-2 text-sm"
                key={`${result.policyId}:${result.reason}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      result.reason === "failed"
                        ? "danger"
                        : result.reason === "delivered"
                          ? "success"
                          : result.reason === "previewed"
                            ? "info"
                            : "neutral"
                    }
                  >
                    {result.reason}
                  </Badge>
                  <span className="font-medium text-[var(--ink)]">{result.policyId}</span>
                </div>
                <div className="text-xs text-[var(--ink-soft)]">
                  {result.error ?? (result.messageId ? `message ${result.messageId}` : "no error")}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3">
        <div className="text-sm font-medium text-[var(--ink)]">Weekly schedules</div>
        {policies.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] p-4 text-sm text-[var(--ink-soft)]">
            No weekly governance delivery schedules yet.
          </div>
        ) : (
          policies.map((policy) => (
            <div
              className="grid gap-3 rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
              key={policy.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={policy.active ? "success" : "neutral"}>
                    {policy.active ? "Active" : "Paused"}
                  </Badge>
                  <Badge variant="info">{policy.channel}</Badge>
                  <span className="text-xs text-[var(--ink-soft)]">
                    {formatPolicySchedule(policy)}
                  </span>
                </div>
                <Button
                  disabled={togglingPolicyId === policy.id}
                  onClick={() => togglePolicy(policy)}
                  size="sm"
                  variant="secondary"
                >
                  {togglingPolicyId === policy.id
                    ? "Updating..."
                    : policy.active
                      ? "Pause"
                      : "Resume"}
                </Button>
              </div>
              <div className="grid gap-1 text-xs text-[var(--ink-soft)] md:grid-cols-2">
                <div>Recipient: {policy.recipient ?? "EMAIL_DEFAULT_TO"}</div>
                <div>Workspace: {policy.workspaceId}</div>
                <div>Last attempt: {formatTimestamp(policy.lastAttemptAt)}</div>
                <div>Last delivered: {formatTimestamp(policy.lastDeliveredAt)}</div>
              </div>
              {policy.lastError ? (
                <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                  {policy.lastError}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className="grid gap-3">
        <div className="text-sm font-medium text-[var(--ink)]">Governance delivery history</div>
        {history.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] p-4 text-sm text-[var(--ink-soft)]">
            No governance delivery ledger rows yet.
          </div>
        ) : (
          history.map((entry) => (
            <div
              className="grid gap-2 rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
              key={entry.id}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={deliveryStatusVariant(entry.status)}>{entry.status}</Badge>
                <Badge variant="neutral">{entry.channel}</Badge>
                <Badge variant="neutral">{entry.mode}</Badge>
                <span className="text-xs text-[var(--ink-soft)]">
                  attempts {entry.attemptCount}
                </span>
              </div>
              <div className="text-sm font-medium text-[var(--ink)]">{entry.headline}</div>
              <div className="grid gap-1 text-xs text-[var(--ink-soft)] md:grid-cols-2">
                <div>Target: {entry.target ?? "connector default"}</div>
                <div>Updated: {formatTimestamp(entry.updatedAt)}</div>
                <div>Delivered: {formatTimestamp(entry.deliveredAt)}</div>
                <div>Policy: {entry.scheduledPolicyId ?? "manual trigger"}</div>
              </div>
              {entry.lastError ? (
                <div className="text-sm text-[var(--danger-strong)]">{entry.lastError}</div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
