import { ErrorBoundary } from "@/components/error-boundary";
import { BriefsPage } from "@/components/briefs/briefs-page";
import { getConnectorRegistry } from "@/lib/connectors";
import {
  generatePortfolioBriefFromSnapshot,
  generateProjectBriefFromSnapshot,
} from "@/lib/briefs/generate";
import { loadExecutiveSnapshot } from "@/lib/briefs/snapshot";
import { getServerRuntimeState } from "@/lib/server/runtime-mode";
import { buildBriefsRuntimeTruth } from "@/lib/server/runtime-truth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function BriefsRoute() {
  const runtimeState = getServerRuntimeState();
  const [snapshot, telegramConnector, emailConnector] = await Promise.all([
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
  ]);
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
        runtimeTruth={runtimeTruth}
      />
    </ErrorBoundary>
  );
}
