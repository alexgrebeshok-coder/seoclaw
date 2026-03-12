import { ErrorBoundary } from "@/components/error-boundary";
import { CommandCenterPage } from "@/components/command-center/command-center-page";
import { getExecutiveExceptionInbox, type ExceptionInboxResult } from "@/lib/command-center";
import { prisma } from "@/lib/prisma";
import { canReadLiveOperatorData, getServerRuntimeState } from "@/lib/server/runtime-mode";
import { buildCommandCenterRuntimeTruth } from "@/lib/server/runtime-truth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emptyInbox: ExceptionInboxResult = {
  syncedAt: null,
  summary: {
    total: 0,
    open: 0,
    acknowledged: 0,
    resolved: 0,
    critical: 0,
    high: 0,
    assigned: 0,
    unassigned: 0,
    escalations: 0,
    reconciliation: 0,
  },
  items: [],
  sync: {
    escalations: null,
    reconciliation: null,
  },
};

export default async function CommandCenterRoute() {
  const runtimeState = getServerRuntimeState();
  const liveCommandCenterReady = canReadLiveOperatorData(runtimeState);

  const [inbox, members] = liveCommandCenterReady
    ? await Promise.all([
        getExecutiveExceptionInbox({ limit: 24 }),
        prisma.teamMember.findMany({
          select: { id: true, initials: true, name: true, role: true },
          orderBy: { name: "asc" },
          take: 50,
        }),
      ])
    : [emptyInbox, []];

  const runtimeTruth = buildCommandCenterRuntimeTruth({
    inbox,
    runtime: runtimeState,
  });

  return (
    <ErrorBoundary resetKey="command-center">
      <CommandCenterPage
        initialInbox={inbox}
        liveCommandCenterReady={liveCommandCenterReady}
        members={members}
        runtimeTruth={runtimeTruth}
      />
    </ErrorBoundary>
  );
}
