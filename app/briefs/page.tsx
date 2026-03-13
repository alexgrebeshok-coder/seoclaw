import { ErrorBoundary } from "@/components/error-boundary";
import { BriefsPage } from "@/components/briefs/briefs-page";
import { listRecentBriefDeliveryLedger } from "@/lib/briefs/delivery-ledger";
import { getConnectorRegistry } from "@/lib/connectors";
import {
  generatePortfolioBriefFromSnapshot,
  generateProjectBriefFromSnapshot,
} from "@/lib/briefs/generate";
import { loadExecutiveSnapshot } from "@/lib/briefs/snapshot";
import type { KnowledgeLoopOverview } from "@/lib/knowledge";
import { getKnowledgeLoopOverview } from "@/lib/knowledge";
import {
  canReadLiveOperatorData,
  getServerRuntimeState,
} from "@/lib/server/runtime-mode";
import { buildBriefsRuntimeTruth } from "@/lib/server/runtime-truth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildEmptyKnowledgeLoopOverview(): KnowledgeLoopOverview {
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalPlaybooks: 0,
      repeatedPlaybooks: 0,
      benchmarkedGuidance: 0,
      trackedPatterns: 0,
    },
    playbooks: [],
    activeGuidance: [],
  };
}

export default async function BriefsRoute() {
  const runtimeState = getServerRuntimeState();
  const knowledgeLoopAvailable = canReadLiveOperatorData(runtimeState);
  const [snapshot, telegramConnector, emailConnector, knowledgeLoop] = await Promise.all([
    runtimeState.healthStatus === "degraded"
      ? Promise.resolve({
          generatedAt: new Date().toISOString(),
          projects: [],
          tasks: [],
          risks: [],
          milestones: [],
          workReports: [],
          teamMembers: [],
        })
      : loadExecutiveSnapshot(),
    getConnectorRegistry().getStatus("telegram"),
    getConnectorRegistry().getStatus("email"),
    knowledgeLoopAvailable
      ? getKnowledgeLoopOverview({ limit: 4 })
      : Promise.resolve(buildEmptyKnowledgeLoopOverview()),
  ]);
  const deliveryLedgerEntries = knowledgeLoopAvailable
    ? await listRecentBriefDeliveryLedger(6)
    : [];
  const portfolioBrief = generatePortfolioBriefFromSnapshot(snapshot, { locale: "ru" });

  const projectIds = Array.from(
    new Set(
      portfolioBrief.topAlerts
        .map((alert) => alert.projectId)
        .filter((value): value is string => Boolean(value))
    )
  ).slice(0, 2);

  const fallbackProjectId =
    projectIds[0] ?? snapshot.projects.find((project) => project.status !== "completed")?.id;

  const finalProjectIds =
    projectIds.length > 0
      ? projectIds
      : fallbackProjectId
        ? [fallbackProjectId]
        : [];

  const projectBriefs = finalProjectIds.map((projectId) =>
    generateProjectBriefFromSnapshot(snapshot, projectId, { locale: "ru" })
  );
  const projectOptions = snapshot.projects
    .filter((project) => project.status !== "completed")
    .map((project) => ({
      id: project.id,
      name: project.name,
    }));
  const runtimeTruth = buildBriefsRuntimeTruth({
    portfolioAlertCount: portfolioBrief.topAlerts.length,
    projectBriefCount: projectBriefs.length,
    runtime: runtimeState,
    telegramConnector,
    emailConnector,
  });

  return (
    <ErrorBoundary resetKey="briefs">
      <BriefsPage
        portfolioBrief={portfolioBrief}
        projectBriefs={projectBriefs}
        projectOptions={projectOptions}
        knowledgeLoop={knowledgeLoop}
        knowledgeLoopAvailabilityNote={
          knowledgeLoopAvailable
            ? undefined
            : runtimeState.dataMode === "demo"
              ? "Knowledge loop is paused in demo mode because it depends on live escalation history, not on illustrative portfolio facts."
              : "Knowledge loop is unavailable until DATABASE_URL is configured for live operator data."
        }
        deliveryLedgerEntries={deliveryLedgerEntries}
        deliveryLedgerAvailabilityNote={
          knowledgeLoopAvailable
            ? undefined
            : runtimeState.dataMode === "demo"
              ? "Delivery ledger is paused in demo mode because outbound execution history is only canonical in live operator mode."
              : "Delivery ledger is unavailable until DATABASE_URL is configured for durable operator history."
        }
        runtimeTruth={runtimeTruth}
      />
    </ErrorBoundary>
  );
}
