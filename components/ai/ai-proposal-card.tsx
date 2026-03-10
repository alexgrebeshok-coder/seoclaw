"use client";

import { Check, Clock3, Sparkles, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAIWorkspace } from "@/contexts/ai-context";
import { useLocale } from "@/contexts/locale-context";
import type { MessageKey } from "@/lib/translations";
import type { AIActionProposal } from "@/lib/ai/types";
import { priorityMeta } from "@/lib/utils";

const proposalStateTone = {
  pending: "warning" as const,
  applied: "success" as const,
  dismissed: "neutral" as const,
};

const proposalStateLabelKey: Record<keyof typeof proposalStateTone, MessageKey> = {
  pending: "ai.proposalState.pending",
  applied: "ai.proposalState.applied",
  dismissed: "ai.proposalState.dismissed",
};

const priorityLabelKey: Record<keyof typeof priorityMeta, MessageKey> = {
  low: "priority.low",
  medium: "priority.medium",
  high: "priority.high",
  critical: "priority.critical",
};

export function AIProposalCard({
  proposal,
  runId,
}: {
  proposal: AIActionProposal;
  runId: string;
}) {
  const { formatDateLocalized, t } = useLocale();
  const { applyProposal, applyingProposalIds, dismissProposal } = useAIWorkspace();
  const isApplying = applyingProposalIds.includes(proposal.id);
  const assigneeCount = new Set(proposal.tasks.map((task) => task.assignee).filter(Boolean)).size;
  const sortedDates = proposal.tasks
    .map((task) => task.dueDate)
    .sort((left, right) => left.localeCompare(right));
  const dueWindow =
    sortedDates.length > 1
      ? `${formatDateLocalized(sortedDates[0], "d MMM")} - ${formatDateLocalized(sortedDates[sortedDates.length - 1], "d MMM")}`
      : sortedDates[0]
        ? formatDateLocalized(sortedDates[0], "d MMM")
        : t("project.none");

  return (
    <div className="rounded-[12px] border border-amber-300/50 bg-amber-50/80 p-5 dark:border-amber-400/20 dark:bg-amber-500/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--surface-panel-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/20">
            <Sparkles className="h-3.5 w-3.5" />
            {t("ai.proposalBadge")}
          </div>
          <h4 className="font-heading text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            {proposal.title}
          </h4>
          <p className="max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">
            {proposal.summary}
          </p>
        </div>
        <Badge variant={proposalStateTone[proposal.state]}>
          {t(proposalStateLabelKey[proposal.state])}
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-[10px] border border-[var(--line)] bg-[color:var(--surface-panel)] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {t("ai.proposal.tasksCount")}
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--ink)]">{proposal.tasks.length}</p>
        </div>
        <div className="rounded-[10px] border border-[var(--line)] bg-[color:var(--surface-panel)] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {t("ai.proposal.assignees")}
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--ink)]">{assigneeCount}</p>
        </div>
        <div className="rounded-[10px] border border-[var(--line)] bg-[color:var(--surface-panel)] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {t("ai.proposal.window")}
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--ink)]">{dueWindow}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {proposal.tasks.map((task) => (
          <div
            key={`${proposal.id}-${task.title}`}
            className="rounded-[10px] border border-[var(--line)] bg-[color:var(--surface-panel)] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-[var(--ink)]">{task.title}</p>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">{task.description}</p>
              </div>
              <Badge className={priorityMeta[task.priority].className}>
                {t(priorityLabelKey[task.priority])}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--ink-muted)]">
              <span className="rounded-full bg-[var(--panel-soft)] px-3 py-1">{task.assignee || "-"}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--panel-soft)] px-3 py-1">
                <Clock3 className="h-3 w-3" />
                {formatDateLocalized(task.dueDate, "d MMM")}
              </span>
              <span className="rounded-full bg-[var(--panel-soft)] px-3 py-1">{task.reason}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          disabled={proposal.state !== "pending" || isApplying}
          onClick={() => applyProposal(runId, proposal.id)}
        >
          <Check className="h-4 w-4" />
          {isApplying ? t("ai.proposalApplying") : t("ai.proposalApply")}
        </Button>
        <Button
          disabled={proposal.state !== "pending" || isApplying}
          onClick={() => dismissProposal(runId, proposal.id)}
          variant="outline"
        >
          <X className="h-4 w-4" />
          {t("ai.proposalDismiss")}
        </Button>
      </div>
    </div>
  );
}
