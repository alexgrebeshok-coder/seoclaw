"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DomainApiCard } from "@/components/layout/domain-api-card";
import { DomainPageHeader } from "@/components/layout/domain-page-header";
import { OperatorRuntimeCard } from "@/components/layout/operator-runtime-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fieldStyles, Input, Textarea } from "@/components/ui/field";
import type {
  PilotFeedbackItemView,
  PilotFeedbackListResult,
  PilotFeedbackSeverity,
  PilotFeedbackStatus,
  PilotFeedbackTargetType,
} from "@/lib/pilot-feedback";
import {
  getOperatorTruthBadge,
  type OperatorRuntimeTruth,
} from "@/lib/server/runtime-truth";
import type { WorkReportMemberOption } from "@/lib/work-reports/types";

const expectedEndpoints = [
  {
    method: "GET" as const,
    note: "Прочитать persisted pilot feedback ledger и увидеть open/in-review/resolved state.",
    path: "/api/pilot-feedback?includeResolved=true&limit=24",
  },
  {
    method: "POST" as const,
    note: "Создать feedback item, привязанный к exception item, workflow run или reconciliation casefile.",
    path: "/api/pilot-feedback",
  },
  {
    method: "PATCH" as const,
    note: "Обновить owner, severity или resolution state для existing feedback item.",
    path: "/api/pilot-feedback/:id",
  },
];

function severityVariant(severity: PilotFeedbackSeverity) {
  switch (severity) {
    case "critical":
      return "danger";
    case "high":
      return "warning";
    case "medium":
      return "info";
    case "low":
    default:
      return "neutral";
  }
}

function statusVariant(status: PilotFeedbackStatus) {
  switch (status) {
    case "resolved":
      return "success";
    case "in_review":
      return "info";
    case "open":
    default:
      return "warning";
  }
}

function targetTypeLabel(targetType: PilotFeedbackTargetType) {
  switch (targetType) {
    case "workflow_run":
      return "Workflow run";
    case "reconciliation_casefile":
      return "Reconciliation case";
    case "exception_item":
    default:
      return "Exception item";
  }
}

function ownerVariant(item: PilotFeedbackItemView) {
  return item.owner.mode === "assigned" ? "success" : "warning";
}

function formatTimestamp(value: string | null | undefined) {
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

type FeedbackFormState = {
  details: string;
  ownerId: string;
  projectId: string;
  projectName: string;
  severity: PilotFeedbackSeverity;
  sourceHref: string;
  sourceLabel: string;
  summary: string;
  targetId: string;
  targetLabel: string;
  targetType: PilotFeedbackTargetType;
};

const emptyFormState: FeedbackFormState = {
  details: "",
  ownerId: "",
  projectId: "",
  projectName: "",
  severity: "medium",
  sourceHref: "",
  sourceLabel: "",
  summary: "",
  targetId: "",
  targetLabel: "",
  targetType: "exception_item",
};

export function PilotFeedbackPage({
  initialFeedback,
  initialTarget,
  liveFeedbackReady,
  members,
  runtimeTruth,
}: {
  initialFeedback: PilotFeedbackListResult;
  initialTarget: Omit<FeedbackFormState, "details" | "ownerId" | "severity" | "summary">;
  liveFeedbackReady: boolean;
  members: WorkReportMemberOption[];
  runtimeTruth: OperatorRuntimeTruth;
}) {
  const runtimeBadge = getOperatorTruthBadge(runtimeTruth);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FeedbackFormState>({
    ...emptyFormState,
    ...initialTarget,
  });

  useEffect(() => {
    setFormState((current) => ({
      ...current,
      ...initialTarget,
      targetType: initialTarget.targetType,
    }));
  }, [initialTarget]);

  const reloadFeedback = async () => {
    const response = await fetch("/api/pilot-feedback?includeResolved=true&limit=24", {
      cache: "no-store",
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error?.message ?? "Не удалось обновить pilot feedback ledger.");
    }

    setFeedback(payload as PilotFeedbackListResult);
  };

  const createFeedback = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/pilot-feedback", {
        body: JSON.stringify({
          details: formState.details || null,
          ownerId: formState.ownerId || null,
          projectId: formState.projectId || null,
          projectName: formState.projectName || null,
          severity: formState.severity,
          sourceHref: formState.sourceHref || null,
          sourceLabel: formState.sourceLabel || null,
          summary: formState.summary,
          targetId: formState.targetId,
          targetLabel: formState.targetLabel,
          targetType: formState.targetType,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Не удалось создать pilot feedback item.");
      }

      await reloadFeedback();
      setFormState((current) => ({
        ...emptyFormState,
        ...initialTarget,
        targetType: current.targetType,
      }));
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Не удалось создать pilot feedback item."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const updateFeedback = async (
    item: PilotFeedbackItemView,
    body: {
      ownerId?: string | null;
      status?: PilotFeedbackStatus;
    }
  ) => {
    setSavingId(item.id);
    setError(null);

    try {
      const response = await fetch(`/api/pilot-feedback/${item.id}`, {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Не удалось обновить pilot feedback item.");
      }

      await reloadFeedback();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Не удалось обновить pilot feedback item."
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="grid min-w-0 gap-6">
      <DomainPageHeader
        actions={
          <>
            <Link className={buttonVariants({ variant: "outline" })} href="/command-center">
              Open command center
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href="/audit-packs">
              Open audit packs
            </Link>
          </>
        }
        chips={[
          { label: runtimeBadge.label, variant: runtimeBadge.variant },
          {
            label:
              feedback.summary.total > 0
                ? `${feedback.summary.total} feedback item${feedback.summary.total === 1 ? "" : "s"}`
                : "No feedback yet",
            variant: feedback.summary.total > 0 ? "info" : "neutral",
          },
          {
            label:
              feedback.summary.open + feedback.summary.inReview > 0
                ? `${feedback.summary.open + feedback.summary.inReview} still active`
                : "No active feedback",
            variant:
              feedback.summary.open + feedback.summary.inReview > 0 ? "warning" : "success",
          },
          {
            label:
              feedback.summary.critical + feedback.summary.high > 0
                ? `${feedback.summary.critical + feedback.summary.high} critical/high`
                : "No critical feedback",
            variant:
              feedback.summary.critical + feedback.summary.high > 0 ? "danger" : "success",
          },
        ]}
        description="Persisted pilot feedback ledger linked to real workflow artifacts. This surface turns audit comments and command-center follow-through into managed product truth with explicit ownership and closure state."
        eyebrow="Pilot loop"
        title="Pilot Feedback"
      />

      <OperatorRuntimeCard truth={runtimeTruth} />

      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Create feedback item</CardTitle>
            <CardDescription>
              Record one durable pilot feedback item against a real workflow artifact, then track it to closure.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 text-sm text-[var(--ink-soft)]">
              <div>
                Target prefill: <span className="font-medium text-[var(--ink)]">{formState.targetLabel || "Manual entry"}</span>
              </div>
              <div>
                Source link: <span className="font-medium text-[var(--ink)]">{formState.sourceHref || "Not provided"}</span>
              </div>
            </div>

            {error ? (
              <div className="rounded-[14px] border border-rose-300/70 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {error}
              </div>
            ) : null}

            <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
              <span>Target type</span>
              <select
                className={fieldStyles}
                disabled={!liveFeedbackReady || isCreating}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    targetType: event.target.value as PilotFeedbackTargetType,
                  }))
                }
                value={formState.targetType}
              >
                <option value="exception_item">Exception item</option>
                <option value="workflow_run">Workflow run</option>
                <option value="reconciliation_casefile">Reconciliation casefile</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
              <span>Target id</span>
              <Input
                disabled={!liveFeedbackReady || isCreating}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    targetId: event.target.value,
                  }))
                }
                placeholder="run-123 or exception:esc-1"
                value={formState.targetId}
              />
            </label>

            <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
              <span>Target label</span>
              <Input
                disabled={!liveFeedbackReady || isCreating}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    targetLabel: event.target.value,
                  }))
                }
                placeholder="Human-readable workflow label"
                value={formState.targetLabel}
              />
            </label>

            <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
              <span>Feedback summary</span>
              <Input
                disabled={!liveFeedbackReady || isCreating}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    summary: event.target.value,
                  }))
                }
                placeholder="What is wrong or needs follow-through?"
                value={formState.summary}
              />
            </label>

            <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
              <span>Details</span>
              <Textarea
                disabled={!liveFeedbackReady || isCreating}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    details: event.target.value,
                  }))
                }
                placeholder="Optional pilot note, reproduction context, or stakeholder expectation."
                value={formState.details}
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
                <span>Severity</span>
                <select
                  className={fieldStyles}
                  disabled={!liveFeedbackReady || isCreating}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      severity: event.target.value as PilotFeedbackSeverity,
                    }))
                  }
                  value={formState.severity}
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
                <span>Owner</span>
                <select
                  className={fieldStyles}
                  disabled={!liveFeedbackReady || isCreating}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      ownerId: event.target.value,
                    }))
                  }
                  value={formState.ownerId}
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} {member.role ? `· ${member.role}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
                <span>Project id</span>
                <Input
                  disabled={!liveFeedbackReady || isCreating}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      projectId: event.target.value,
                    }))
                  }
                  placeholder="Optional project id"
                  value={formState.projectId}
                />
              </label>

              <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
                <span>Project name</span>
                <Input
                  disabled={!liveFeedbackReady || isCreating}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      projectName: event.target.value,
                    }))
                  }
                  placeholder="Optional project name"
                  value={formState.projectName}
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
                <span>Source label</span>
                <Input
                  disabled={!liveFeedbackReady || isCreating}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      sourceLabel: event.target.value,
                    }))
                  }
                  placeholder="Command center exception"
                  value={formState.sourceLabel}
                />
              </label>

              <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
                <span>Source href</span>
                <Input
                  disabled={!liveFeedbackReady || isCreating}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      sourceHref: event.target.value,
                    }))
                  }
                  placeholder="/command-center"
                  value={formState.sourceHref}
                />
              </label>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                disabled={
                  !liveFeedbackReady ||
                  isCreating ||
                  !formState.targetId.trim() ||
                  !formState.targetLabel.trim() ||
                  !formState.summary.trim()
                }
                onClick={createFeedback}
              >
                {isCreating ? "Creating..." : "Create feedback"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle>Feedback ledger</CardTitle>
                <CardDescription>
                  Open, in-review, and resolved pilot feedback linked to real workflow artifacts.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="warning">Open {feedback.summary.open}</Badge>
                <Badge variant="info">Review {feedback.summary.inReview}</Badge>
                <Badge variant="success">Resolved {feedback.summary.resolved}</Badge>
                <Badge variant="danger">Critical {feedback.summary.critical}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            {liveFeedbackReady ? (
              feedback.items.length > 0 ? (
                <div className="grid gap-3">
                  {feedback.items.map((item) => {
                    const assignedOwnerId = item.owner.mode === "assigned" ? item.owner.id ?? "" : "";

                    return (
                      <div
                        className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
                        key={item.id}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-[var(--ink)]">{item.summary}</div>
                            <div className="mt-1 text-xs text-[var(--ink-soft)]">
                              {item.targetLabel} · {item.projectName ?? "No linked project"}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="neutral">{targetTypeLabel(item.targetType)}</Badge>
                            <Badge variant={severityVariant(item.severity)}>{item.severity}</Badge>
                            <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                          </div>
                        </div>

                        {item.details ? (
                          <div className="mt-3 text-sm text-[var(--ink-soft)]">{item.details}</div>
                        ) : null}

                        <div className="mt-3 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <div className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">Owner</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Badge variant={ownerVariant(item)}>{item.owner.mode}</Badge>
                              <span className="font-medium text-[var(--ink)]">{item.owner.name}</span>
                            </div>
                            <div className="mt-1 text-xs text-[var(--ink-soft)]">
                              {item.owner.role ?? "No role attached"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">Source</div>
                            <div className="mt-1 font-medium text-[var(--ink)]">{item.sourceLabel}</div>
                            <div className="mt-1 text-xs text-[var(--ink-soft)]">
                              Opened {formatTimestamp(item.openedAt)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">Reporter</div>
                            <div className="mt-1 font-medium text-[var(--ink)]">
                              {item.reporterName ?? "Operator"}
                            </div>
                            <div className="mt-1 text-xs text-[var(--ink-soft)]">
                              Updated {formatTimestamp(item.updatedAt)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">Resolution</div>
                            <div className="mt-1 font-medium text-[var(--ink)]">
                              {item.resolvedAt ? formatTimestamp(item.resolvedAt) : "Still active"}
                            </div>
                            <div className="mt-1 text-xs text-[var(--ink-soft)]">
                              {item.resolutionNote ?? "No resolution note"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.links.map((link) => (
                            <Link
                              className={buttonVariants({ size: "sm", variant: "outline" })}
                              href={link.href}
                              key={`${item.id}:${link.href}`}
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>

                        <div className="mt-4 grid gap-3 rounded-[14px] border border-[var(--line)]/80 bg-[var(--surface)]/70 p-3 md:grid-cols-[minmax(0,1fr)_auto]">
                          <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
                            <span>Assign owner</span>
                            <select
                              className={fieldStyles}
                              disabled={savingId === item.id}
                              onChange={(event) =>
                                updateFeedback(item, {
                                  ownerId: event.target.value || null,
                                })
                              }
                              value={assignedOwnerId}
                            >
                              <option value="">Unassigned</option>
                              {members.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.name} {member.role ? `· ${member.role}` : ""}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="flex flex-wrap items-end gap-2">
                            {item.status === "open" ? (
                              <Button
                                disabled={savingId === item.id}
                                onClick={() =>
                                  updateFeedback(item, {
                                    status: "in_review",
                                  })
                                }
                                size="sm"
                                variant="outline"
                              >
                                Mark in review
                              </Button>
                            ) : null}
                            {item.status !== "resolved" ? (
                              <Button
                                disabled={savingId === item.id}
                                onClick={() =>
                                  updateFeedback(item, {
                                    status: "resolved",
                                  })
                                }
                                size="sm"
                              >
                                Resolve
                              </Button>
                            ) : (
                              <Button
                                disabled={savingId === item.id}
                                onClick={() =>
                                  updateFeedback(item, {
                                    status: "open",
                                  })
                                }
                                size="sm"
                                variant="outline"
                              >
                                Reopen
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[16px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] p-4 text-sm text-[var(--ink-soft)]">
                  No pilot feedback yet. Open this page from command center or audit packs to prefill one real workflow artifact.
                </div>
              )
            ) : (
              <div className="rounded-[16px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] p-4 text-sm text-[var(--ink-soft)]">
                Demo mode or missing live database configuration keeps pilot feedback in a safe preview state.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DomainApiCard
        description="Pilot feedback stays narrow: one persisted ledger over existing command and audit workflows instead of a broad ticketing subsystem."
        endpoints={expectedEndpoints}
        title="Backend Endpoints"
      />
    </div>
  );
}
