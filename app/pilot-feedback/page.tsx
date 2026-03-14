import { ErrorBoundary } from "@/components/error-boundary";
import { PilotFeedbackPage } from "@/components/pilot-feedback/pilot-feedback-page";
import { listPilotFeedback } from "@/lib/pilot-feedback";
import { prisma } from "@/lib/prisma";
import { canReadLiveOperatorData, getServerRuntimeState } from "@/lib/server/runtime-mode";
import { buildPilotFeedbackRuntimeTruth } from "@/lib/server/runtime-truth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PilotFeedbackRoute({
  searchParams,
}: {
  searchParams?: Promise<{
    projectId?: string;
    projectName?: string;
    sourceHref?: string;
    sourceLabel?: string;
    targetId?: string;
    targetLabel?: string;
    targetType?: "exception_item" | "reconciliation_casefile" | "workflow_run";
  }>;
}) {
  const runtimeState = getServerRuntimeState();
  const liveFeedbackReady = canReadLiveOperatorData(runtimeState);
  const params = (await searchParams) ?? {};

  const emptyFeedback = {
    items: [],
    summary: {
      total: 0,
      open: 0,
      inReview: 0,
      resolved: 0,
      critical: 0,
      high: 0,
      assigned: 0,
      unassigned: 0,
      workflowRuns: 0,
      exceptionItems: 0,
      reconciliationTargets: 0,
    },
  };

  let feedback = emptyFeedback;
  let members: Array<{ id: string; initials: string | null; name: string; role: string | null }> = [];
  let usingFallback = false;

  if (liveFeedbackReady) {
    try {
      const [feedbackResult, membersResult] = await Promise.all([
        listPilotFeedback({ includeResolved: true, limit: 24 }),
        prisma.teamMember.findMany({
          orderBy: { name: "asc" },
          select: { id: true, initials: true, name: true, role: true },
          take: 50,
        }),
      ]);
      feedback = feedbackResult;
      members = membersResult;
    } catch (error) {
      console.error("[PilotFeedback] Failed to load live data, using fallback:", error);
      usingFallback = true;
    }
  }

  const runtimeTruth = buildPilotFeedbackRuntimeTruth({
    feedback,
    runtime: runtimeState,
  });

  const fallbackNote = usingFallback
    ? "Demo mode: Using mock data. Configure DATABASE_URL for live data."
    : undefined;

  return (
    <ErrorBoundary resetKey="pilot-feedback">
      <PilotFeedbackPage
        initialFeedback={feedback}
        initialTarget={{
          projectId: params.projectId ?? "",
          projectName: params.projectName ?? "",
          sourceHref: params.sourceHref ?? "",
          sourceLabel: params.sourceLabel ?? "",
          targetId: params.targetId ?? "",
          targetLabel: params.targetLabel ?? "",
          targetType: params.targetType ?? "exception_item",
        }}
        liveFeedbackReady={liveFeedbackReady && !usingFallback}
        members={members}
        runtimeTruth={runtimeTruth}
        fallbackNote={fallbackNote}
      />
    </ErrorBoundary>
  );
}
