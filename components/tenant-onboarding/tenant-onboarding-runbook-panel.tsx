"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea, fieldStyles } from "@/components/ui/field";
import type {
  TenantOnboardingOverview,
  TenantOnboardingRunbookRecord,
  TenantOnboardingRunbookStatus,
} from "@/lib/tenant-onboarding";

interface RunbookEditorState {
  handoffNotes: string;
  operatorNotes: string;
  rollbackPlan: string;
  rolloutScope: string;
  status: TenantOnboardingRunbookStatus;
  summary: string;
  targetCutoverAt: string;
  targetTenantLabel: string;
  targetTenantSlug: string;
}

function statusVariant(status: TenantOnboardingRunbookStatus) {
  switch (status) {
    case "completed":
      return "success";
    case "scheduled":
      return "info";
    case "prepared":
      return "warning";
    case "draft":
    default:
      return "neutral";
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

function toLocalDateTimeInputValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function createEmptyEditorState(): RunbookEditorState {
  return {
    handoffNotes: "",
    operatorNotes: "",
    rollbackPlan: "",
    rolloutScope: "",
    status: "draft",
    summary: "",
    targetCutoverAt: "",
    targetTenantLabel: "",
    targetTenantSlug: "",
  };
}

function createEditorStateFromRunbook(entry: TenantOnboardingRunbookRecord): RunbookEditorState {
  return {
    handoffNotes: entry.handoffNotes ?? "",
    operatorNotes: entry.operatorNotes ?? "",
    rollbackPlan: entry.rollbackPlan ?? "",
    rolloutScope: entry.rolloutScope,
    status: entry.status,
    summary: entry.summary,
    targetCutoverAt: toLocalDateTimeInputValue(entry.targetCutoverAt),
    targetTenantLabel: entry.targetTenantLabel ?? "",
    targetTenantSlug: entry.targetTenantSlug ?? "",
  };
}

export function TenantOnboardingRunbookPanel({
  availabilityNote,
  initialOverview,
}: {
  availabilityNote?: string;
  initialOverview: TenantOnboardingOverview;
}) {
  const [overview, setOverview] = useState(initialOverview);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editor, setEditor] = useState<RunbookEditorState>(createEmptyEditorState());
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function loadOverview(focusId?: string | null) {
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/tenant-onboarding", {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to load tenant onboarding.");
      }

      const nextOverview = payload as TenantOnboardingOverview;
      setOverview(nextOverview);
      setError(null);

      const nextFocusId = focusId ?? editingId;
      if (nextFocusId) {
        const matched = nextOverview.runbooks.find((entry) => entry.id === nextFocusId);
        if (matched) {
          setEditingId(matched.id);
          setEditor(createEditorStateFromRunbook(matched));
          return;
        }
      }

      setEditingId(null);
      setEditor(createEmptyEditorState());
    } catch (loadingError) {
      setError(
        loadingError instanceof Error
          ? loadingError.message
          : "Failed to load tenant onboarding."
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  async function saveRunbook() {
    setIsSaving(true);

    try {
      const requestBody = {
        handoffNotes: editor.handoffNotes.trim() || null,
        operatorNotes: editor.operatorNotes.trim() || null,
        rollbackPlan: editor.rollbackPlan.trim() || null,
        rolloutScope: editor.rolloutScope.trim(),
        status: editor.status,
        summary: editor.summary.trim(),
        targetCutoverAt: editor.targetCutoverAt
          ? new Date(editor.targetCutoverAt).toISOString()
          : null,
        targetTenantLabel: editor.targetTenantLabel.trim() || null,
        targetTenantSlug: editor.targetTenantSlug.trim() || null,
      };
      const response = await fetch(
        editingId ? `/api/tenant-onboarding/${editingId}` : "/api/tenant-onboarding",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to save tenant onboarding runbook.");
      }

      const saved = payload as TenantOnboardingRunbookRecord;
      setEditingId(saved.id);
      setEditor(createEditorStateFromRunbook(saved));
      setError(null);
      await loadOverview(saved.id);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save tenant onboarding runbook."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function loadEntry(entry: TenantOnboardingRunbookRecord) {
    setEditingId(entry.id);
    setEditor(createEditorStateFromRunbook(entry));
    setError(null);
  }

  function startNewDraft() {
    setEditingId(null);
    setEditor(createEmptyEditorState());
    setError(null);
  }

  const canSave =
    !availabilityNote &&
    !isSaving &&
    editor.summary.trim().length > 0 &&
    editor.rolloutScope.trim().length > 0;

  return (
    <div className="grid gap-4 rounded-[18px] border border-[var(--line)] bg-[var(--surface-panel)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-[var(--ink)]">Tenant rollout runbook</div>
          <div className="mt-1 text-xs text-[var(--ink-soft)]">
            Persist the target tenant, rollout scope, handoff notes, and rollback posture on top
            of the current readiness and governance baseline.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">{overview.template.version}</Badge>
          <Badge variant="info">{overview.currentReadiness.tenant.slug}</Badge>
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

      <div className="grid gap-3 rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 md:grid-cols-4">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Baseline readiness
          </div>
          <div className="mt-1 font-medium text-[var(--ink)]">
            {overview.currentReadiness.outcomeLabel}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Current review
          </div>
          <div className="mt-1 font-medium text-[var(--ink)]">
            {overview.currentReview.outcomeLabel}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Latest decision
          </div>
          <div className="mt-1 font-medium text-[var(--ink)]">
            {overview.latestDecision?.decisionLabel ?? "No decision yet"}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Saved runbooks
          </div>
          <div className="mt-1 font-medium text-[var(--ink)]">{overview.summary.total}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => loadOverview()}
          type="button"
          variant="outline"
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
        <Button onClick={startNewDraft} type="button" variant="outline">
          Start new draft
        </Button>
        {overview.latestRunbook ? (
          <Button
            onClick={() => loadEntry(overview.latestRunbook as TenantOnboardingRunbookRecord)}
            type="button"
            variant="outline"
          >
            Edit latest runbook
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="grid gap-4 rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-[var(--ink)]">
                {editingId ? "Edit runbook" : "New runbook"}
              </div>
              <div className="mt-1 text-xs text-[var(--ink-soft)]">
                {editingId
                  ? "Updating a runbook refreshes the readiness, review, and decision snapshot."
                  : "Creating a runbook captures the current baseline and adds target-tenant notes."}
              </div>
            </div>
            <Badge variant={statusVariant(editor.status)}>
              {editingId ? editor.status : "draft"}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
              <span>Target tenant slug</span>
              <Input
                onChange={(event) =>
                  setEditor((current) => ({ ...current, targetTenantSlug: event.target.value }))
                }
                placeholder="tenant-north"
                value={editor.targetTenantSlug}
              />
            </label>

            <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
              <span>Target tenant label</span>
              <Input
                onChange={(event) =>
                  setEditor((current) => ({ ...current, targetTenantLabel: event.target.value }))
                }
                placeholder="Northern rollout pilot"
                value={editor.targetTenantLabel}
              />
            </label>

            <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
              <span>Status</span>
              <select
                className={fieldStyles}
                onChange={(event) =>
                  setEditor((current) => ({
                    ...current,
                    status: event.target.value as TenantOnboardingRunbookStatus,
                  }))
                }
                value={editor.status}
              >
                <option value="draft">Draft</option>
                <option value="prepared">Prepared</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
              <span>Target cutover</span>
              <Input
                onChange={(event) =>
                  setEditor((current) => ({ ...current, targetCutoverAt: event.target.value }))
                }
                type="datetime-local"
                value={editor.targetCutoverAt}
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
            <span>Runbook summary</span>
            <Input
              onChange={(event) =>
                setEditor((current) => ({ ...current, summary: event.target.value }))
              }
              placeholder="Short operator-facing summary for this rollout cycle"
              value={editor.summary}
            />
          </label>

          <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
            <span>Rollout scope</span>
            <Textarea
              onChange={(event) =>
                setEditor((current) => ({ ...current, rolloutScope: event.target.value }))
              }
              placeholder="What is being widened, for whom, and under which guardrails?"
              rows={4}
              value={editor.rolloutScope}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
              <span>Operator notes</span>
              <Textarea
                onChange={(event) =>
                  setEditor((current) => ({ ...current, operatorNotes: event.target.value }))
                }
                placeholder="Operational context, dependencies, and caveats"
                rows={5}
                value={editor.operatorNotes}
              />
            </label>

            <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
              <span>Handoff notes</span>
              <Textarea
                onChange={(event) =>
                  setEditor((current) => ({ ...current, handoffNotes: event.target.value }))
                }
                placeholder="What the next operator or reviewer must know"
                rows={5}
                value={editor.handoffNotes}
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
            <span>Rollback posture</span>
            <Textarea
              onChange={(event) =>
                setEditor((current) => ({ ...current, rollbackPlan: event.target.value }))
              }
              placeholder="How to unwind or pause the rollout if the next tenant is not ready"
              rows={4}
              value={editor.rollbackPlan}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button disabled={!canSave} onClick={saveRunbook} type="button">
              {isSaving ? "Saving..." : editingId ? "Update runbook" : "Create runbook"}
            </Button>
            {editingId ? (
              <Button onClick={startNewDraft} type="button" variant="outline">
                Stop editing
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4">
          {overview.latestRunbook ? (
            <div className="rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-[var(--ink)]">Latest saved runbook</div>
                  <div className="mt-1 text-xs text-[var(--ink-soft)]">
                    Updated {formatTimestamp(overview.latestRunbook.updatedAt)}
                  </div>
                </div>
                <Badge variant={statusVariant(overview.latestRunbook.status)}>
                  {overview.latestRunbook.statusLabel}
                </Badge>
              </div>
              <div className="mt-3 text-sm text-[var(--ink)]">
                {overview.latestRunbook.summary}
              </div>
              <div className="mt-3 grid gap-2 text-xs text-[var(--ink-soft)] md:grid-cols-2">
                <div>
                  Baseline: {overview.latestRunbook.baselineTenantSlug} ·{" "}
                  {overview.latestRunbook.readinessOutcomeLabel}
                </div>
                <div>
                  Target:{" "}
                  {overview.latestRunbook.targetTenantSlug ??
                    overview.latestRunbook.targetTenantLabel ??
                    "Not set"}
                </div>
                <div>
                  Review: {overview.latestRunbook.reviewOutcomeLabel}
                </div>
                <div>
                  Decision: {overview.latestRunbook.latestDecisionLabel ?? "No decision snapshot"}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[14px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] p-4 text-sm text-[var(--ink-soft)]">
              No runbook has been saved yet. The template above is ready, but the handoff still
              depends on memory until a runbook entry is created.
            </div>
          )}

          <div className="grid gap-3">
            {overview.runbooks.length > 0 ? (
              overview.runbooks.map((entry) => (
                <div
                  className="rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
                  key={entry.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--ink)]">{entry.summary}</div>
                      <div className="mt-1 text-xs text-[var(--ink-soft)]">
                        Updated {formatTimestamp(entry.updatedAt)}
                      </div>
                    </div>
                    <Badge variant={statusVariant(entry.status)}>{entry.statusLabel}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-[var(--ink-soft)] md:grid-cols-2">
                    <div>
                      Target: {entry.targetTenantSlug ?? entry.targetTenantLabel ?? "Not set"}
                    </div>
                    <div>
                      Cutover: {formatTimestamp(entry.targetCutoverAt)}
                    </div>
                    <div>
                      Snapshot: {entry.readinessOutcomeLabel} readiness · {entry.reviewOutcomeLabel}{" "}
                      review
                    </div>
                    <div>
                      Decision: {entry.latestDecisionLabel ?? "No decision snapshot"}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button onClick={() => loadEntry(entry)} type="button" variant="outline">
                      Edit
                    </Button>
                  </div>
                </div>
              ))
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
