import { ErrorBoundary } from "@/components/error-boundary";
import { WorkReportsPage } from "@/components/work-reports/work-reports-page";
import { getEscalationQueueOverview } from "@/lib/escalations";
import { prisma } from "@/lib/prisma";
import { canReadLiveOperatorData, getServerRuntimeState } from "@/lib/server/runtime-mode";
import { getVideoFactOverview } from "@/lib/video-facts/service";
import { buildWorkReportsRuntimeTruth } from "@/lib/server/runtime-truth";
import { listWorkReports } from "@/lib/work-reports/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function WorkReportsRoute() {
  const runtimeState = getServerRuntimeState();
  const liveWorkflowReady = canReadLiveOperatorData(runtimeState);

  const reports = liveWorkflowReady ? await listWorkReports({ limit: 20 }) : [];

  const [projects, members, escalationQueue, videoFacts] = liveWorkflowReady
    ? await Promise.all([
        prisma.project.findMany({
          select: { id: true, name: true },
          orderBy: { updatedAt: "desc" },
          take: 50,
        }),
        prisma.teamMember.findMany({
          select: { id: true, initials: true, name: true, role: true },
          orderBy: { name: "asc" },
          take: 50,
        }),
        getEscalationQueueOverview({ limit: 8 }),
        getVideoFactOverview({ limit: 6 }),
      ])
    : [
        [],
        [],
        null,
        {
          syncedAt: new Date().toISOString(),
          summary: {
            total: 0,
            observed: 0,
            verified: 0,
            averageConfidence: null,
            lastCapturedAt: null,
          },
          items: [],
        },
      ];
  const runtimeTruth = buildWorkReportsRuntimeTruth({
    queue: escalationQueue,
    reportCount: reports.length,
    runtime: runtimeState,
  });

  return (
    <ErrorBoundary resetKey="work-reports">
      <WorkReportsPage
        escalationQueue={escalationQueue}
        liveWorkflowReady={liveWorkflowReady}
        members={members}
        projects={projects}
        reports={reports}
        runtimeTruth={runtimeTruth}
        videoFacts={videoFacts}
      />
    </ErrorBoundary>
  );
}
