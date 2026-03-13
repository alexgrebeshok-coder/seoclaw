"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea, fieldStyles } from "@/components/ui/field";
import type {
  CutoverDecisionRecord,
  CutoverDecisionRegister,
  CutoverDecisionType,
} from "@/lib/cutover-decisions";

interface WarningOption {
  id: string;
  title: string;
}

function decisionVariant(decisionType: CutoverDecisionType) {
  switch (decisionType) {
    case "cutover_approved":
      return "success";
    case "warning_waiver":
      return "warning";
    case "rollback":
    default:
      return "danger";
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

export function CutoverDecisionRegisterPanel({
  availabilityNote,
  currentReadinessOutcomeLabel,
  currentReviewOutcomeLabel,
  initialRegister,
  tenantSlug,
  warningOptions,
}: {
  availabilityNote?: string;
  currentReadinessOutcomeLabel: string;
  currentReviewOutcomeLabel: string;
  initialRegister: CutoverDecisionRegister;
  tenantSlug: string;
  warningOptions: WarningOption[];
}) {
  const [register, setRegister] = useState(initialRegister);
  const [decisionType, setDecisionType] =
    useState<CutoverDecisionType>(warningOptions.length > 0 ? "warning_waiver" : "cutover_approved");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [warningId, setWarningId] = useState("");
  const [warningLabel, setWarningLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadRegister() {
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/tenant-readiness/decisions", {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to load cutover decision register.");
      }

      setRegister(payload as CutoverDecisionRegister);
      setError(null);
    } catch (loadingError) {
      setError(
        loadingError instanceof Error
          ? loadingError.message
          : "Failed to load cutover decision register."
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  async function createDecision() {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tenant-readiness/decisions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          decisionType,
          details: details.trim() || null,
          summary: summary.trim(),
          warningId: decisionType === "warning_waiver" ? warningId || null : null,
          warningLabel: decisionType === "warning_waiver" ? warningLabel.trim() || null : null,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to create cutover decision.");
      }

      setSummary("");
      setDetails("");
      setWarningId("");
      setWarningLabel("");
      setError(null);
      await loadRegister();
    } catch (creationError) {
      setError(
        creationError instanceof Error
          ? creationError.message
          : "Failed to create cutover decision."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function applyWarningOption(option: WarningOption) {
    setWarningId(option.id);
    setWarningLabel(option.title);
    setDecisionType("warning_waiver");
  }

  const latestDecision = register.latestDecision;
  const canSubmit =
    !availabilityNote &&
    !isSubmitting &&
    summary.trim().length > 0 &&
    (decisionType !== "warning_waiver" || warningLabel.trim().length > 0);

  return (
    <div className="grid gap-4 rounded-[18px] border border-[var(--line)] bg-[var(--surface-panel)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-[var(--ink)]">Cutover decision register</div>
          <div className="mt-1 text-xs text-[var(--ink-soft)]">
            Durable governance log for cutover approval, warning waivers, and rollback entries.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">{tenantSlug}</Badge>
          <Badge variant="info">Append-only</Badge>
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

      <div className="grid gap-3 rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 md:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Current readiness
          </div>
          <div className="mt-1 font-medium text-[var(--ink)]">{currentReadinessOutcomeLabel}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Current review
          </div>
          <div className="mt-1 font-medium text-[var(--ink)]">{currentReviewOutcomeLabel}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Register entries
          </div>
          <div className="mt-1 font-medium text-[var(--ink)]">{register.summary.total}</div>
        </div>
      </div>

      {latestDecision ? (
        <div className="grid gap-3 rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-[var(--ink)]">Latest governance decision</div>
              <div className="mt-1 text-xs text-[var(--ink-soft)]">
                {formatTimestamp(latestDecision.createdAt)}
              </div>
            </div>
            <Badge variant={decisionVariant(latestDecision.decisionType)}>
              {latestDecision.decisionLabel}
            </Badge>
          </div>
          <div className="text-sm text-[var(--ink)]">{latestDecision.summary}</div>
          <div className="grid gap-2 text-xs text-[var(--ink-soft)] md:grid-cols-2">
            <div>
              Actor: {latestDecision.createdByName ?? latestDecision.createdByUserId ?? "Unknown"}{" "}
              {latestDecision.createdByRole ? `· ${latestDecision.createdByRole}` : ""}
            </div>
            <div>
              Snapshot: {latestDecision.readinessOutcomeLabel} readiness ·{" "}
              {latestDecision.reviewOutcomeLabel} review
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
          <span>Decision type</span>
          <select
            className={fieldStyles}
            onChange={(event) => setDecisionType(event.target.value as CutoverDecisionType)}
            value={decisionType}
          >
            <option value="cutover_approved">Cutover approved</option>
            <option value="warning_waiver">Warning waiver</option>
            <option value="rollback">Rollback recorded</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
          <span>Summary</span>
          <Input
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Short operator-facing decision summary"
            value={summary}
          />
        </label>
      </div>

      {decisionType === "warning_waiver" ? (
        <div className="grid gap-3 rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
          <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
            <span>Waived warning label</span>
            <Input
              onChange={(event) => setWarningLabel(event.target.value)}
              placeholder="Required for warning waivers"
              value={warningLabel}
            />
          </label>
          {warningOptions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {warningOptions.map((option) => (
                <Button
                  key={option.id}
                  onClick={() => applyWarningOption(option)}
                  size="sm"
                  variant="secondary"
                >
                  {option.title}
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[var(--ink-soft)]">
              No current readiness warnings are available, so waiver text must be entered manually.
            </div>
          )}
        </div>
      ) : null}

      <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
        <span>Details</span>
        <Textarea
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Optional operator context, rationale, or rollback note"
          value={details}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={!canSubmit} onClick={createDecision}>
          {isSubmitting ? "Recording..." : "Record governance decision"}
        </Button>
        <Button
          disabled={Boolean(availabilityNote) || isRefreshing}
          onClick={loadRegister}
          variant="ghost"
        >
          {isRefreshing ? "Refreshing..." : "Refresh register"}
        </Button>
      </div>

      <div className="grid gap-3">
        <div className="text-sm font-medium text-[var(--ink)]">Decision history</div>
        {register.entries.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] p-4 text-sm text-[var(--ink-soft)]">
            No cutover governance decisions have been recorded yet.
          </div>
        ) : (
          register.entries.map((entry: CutoverDecisionRecord) => (
            <div
              className="grid gap-3 rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
              key={entry.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={decisionVariant(entry.decisionType)}>{entry.decisionLabel}</Badge>
                  {entry.warningLabel ? <Badge variant="neutral">{entry.warningLabel}</Badge> : null}
                </div>
                <div className="text-xs text-[var(--ink-soft)]">
                  {formatTimestamp(entry.createdAt)}
                </div>
              </div>
              <div className="text-sm font-medium text-[var(--ink)]">{entry.summary}</div>
              {entry.details ? (
                <div className="text-sm text-[var(--ink-soft)]">{entry.details}</div>
              ) : null}
              <div className="grid gap-2 text-xs text-[var(--ink-soft)] md:grid-cols-2">
                <div>
                  Actor: {entry.createdByName ?? entry.createdByUserId ?? "Unknown"}
                  {entry.createdByRole ? ` · ${entry.createdByRole}` : ""}
                </div>
                <div>Tenant: {entry.tenantSlug}</div>
                <div>
                  Readiness snapshot:{" "}
                  <span className="font-medium text-[var(--ink)]">
                    {entry.readinessOutcomeLabel}
                  </span>
                </div>
                <div>
                  Review snapshot:{" "}
                  <span className="font-medium text-[var(--ink)]">
                    {entry.reviewOutcomeLabel}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
