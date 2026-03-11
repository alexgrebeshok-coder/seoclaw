import { ErrorBoundary } from "@/components/error-boundary";
import { WorkReportsPage } from "@/components/work-reports/work-reports-page";
import { getEscalationQueueOverview } from "@/lib/escalations";
import { prisma } from "@/lib/prisma";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";
import { listWorkReports } from "@/lib/work-reports/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function WorkReportsRoute() {
  const runtimeState = getServerRuntimeState();

  const reports =
    runtimeState.databaseConfigured
      ? await listWorkReports({ limit: 20 })
      : [];

  const [projects, members, escalationQueue] = runtimeState.databaseConfigured
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
      ])
    : [[], [], null];

  return (
    <ErrorBoundary resetKey="work-reports">
      <WorkReportsPage
        databaseReady={runtimeState.databaseConfigured}
        escalationQueue={escalationQueue}
        members={members}
        projects={projects}
        reports={reports}
      />
    </ErrorBoundary>
  );
}
