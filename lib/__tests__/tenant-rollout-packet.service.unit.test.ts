import assert from "node:assert/strict";

import { buildAccessProfile } from "@/lib/auth/access-profile";
import { getTenantRolloutPacket } from "@/lib/tenant-rollout-packet";
import type { TenantOnboardingOverview } from "@/lib/tenant-onboarding";

function createOverview(
  overrides: Partial<TenantOnboardingOverview> = {}
): TenantOnboardingOverview {
  return {
    accessProfile: {
      organizationSlug: "tenant-yamal",
      role: "EXEC",
      workspaceId: "executive",
    },
    currentReadiness: {
      generatedAt: "2026-03-12T15:00:00.000Z",
      outcome: "ready",
      outcomeLabel: "Ready",
      posture: {
        liveMutationAllowed: true,
        stage: "controlled",
        stageLabel: "Controlled rollout",
        tenantSlug: "tenant-yamal",
        writeWorkspaces: ["delivery", "executive"],
      },
      summary: {
        blockers: 0,
        warnings: 0,
      },
      tenant: {
        label: "Configured pilot tenant",
        slug: "tenant-yamal",
        source: "pilot_control",
      },
    },
    currentReview: {
      artifact: {
        fileName: "ceoclaw-pilot-review.md",
        format: "markdown",
      },
      generatedAt: "2026-03-12T15:05:00.000Z",
      outcome: "ready",
      outcomeLabel: "Ready",
      summary: {
        blockedSections: 0,
        openExceptions: 0,
        openFeedback: 0,
        warningSections: 0,
      },
    },
    generatedAt: "2026-03-12T15:12:00.000Z",
    latestDecision: {
      createdAt: "2026-03-12T15:10:00.000Z",
      createdByName: "Alex",
      createdByRole: "EXEC",
      createdByUserId: "alex-1",
      decisionLabel: "Cutover approved",
      decisionType: "cutover_approved",
      details: null,
      id: "decision-1",
      readinessGeneratedAt: "2026-03-12T15:00:00.000Z",
      readinessOutcome: "ready",
      readinessOutcomeLabel: "Ready",
      reviewGeneratedAt: "2026-03-12T15:05:00.000Z",
      reviewOutcome: "ready",
      reviewOutcomeLabel: "Ready",
      summary: "Approved the next widening window.",
      tenantSlug: "tenant-yamal",
      warningId: null,
      warningLabel: null,
      workspaceId: "executive",
    },
    latestRunbook: {
      baselineTenantLabel: "Configured pilot tenant",
      baselineTenantSlug: "tenant-yamal",
      blockerCount: 0,
      createdAt: "2026-03-12T15:11:00.000Z",
      createdByName: "Alex",
      createdByRole: "EXEC",
      createdByUserId: "alex-1",
      handoffNotes: "Share with the executive reviewer before widening.",
      id: "runbook-1",
      latestDecisionAt: "2026-03-12T15:10:00.000Z",
      latestDecisionLabel: "Cutover approved",
      latestDecisionSummary: "Approved the next widening window.",
      latestDecisionType: "cutover_approved",
      operatorNotes: "Start live writes in delivery workspace first.",
      readinessGeneratedAt: "2026-03-12T15:00:00.000Z",
      readinessOutcome: "ready",
      readinessOutcomeLabel: "Ready",
      reviewGeneratedAt: "2026-03-12T15:05:00.000Z",
      reviewOutcome: "ready",
      reviewOutcomeLabel: "Ready",
      rollbackPlan: "Rollback to the current tenant boundary.",
      rolloutScope: "Prepare the northern tenant widening packet using the approved baseline.",
      status: "scheduled",
      statusLabel: "Scheduled",
      summary: "Schedule the northern tenant rollout.",
      targetCutoverAt: "2026-03-15T09:00:00.000Z",
      targetTenantLabel: "Northern tenant",
      targetTenantSlug: "tenant-north",
      templateVersion: "tenant-rollout-v1",
      updatedAt: "2026-03-12T15:12:00.000Z",
      updatedByUserId: "alex-1",
      warningCount: 0,
      workspaceId: "executive",
    },
    persistenceAvailable: true,
    runbooks: [],
    summary: {
      completed: 0,
      draft: 0,
      prepared: 0,
      scheduled: 1,
      total: 1,
    },
    template: {
      intro: "Onboarding template",
      items: [],
      version: "tenant-rollout-v1",
    },
    ...overrides,
  };
}

async function testBuildsRunbookBackedPacket() {
  const packet = await getTenantRolloutPacket({
    accessProfile: buildAccessProfile({
      organizationSlug: "tenant-yamal",
      role: "EXEC",
      workspaceId: "executive",
    }),
    now: () => new Date("2026-03-12T15:20:00.000Z"),
    overview: createOverview(),
  });

  assert.equal(packet.handoff.state, "ready");
  assert.equal(packet.handoff.isRunbookBacked, true);
  assert.equal(packet.artifact.fileName, "tenant-rollout-packet-tenant-north.md");
  assert.equal(packet.sections.length, 5);
  assert.match(packet.artifact.content, /Schedule the northern tenant rollout\./);
  assert.match(packet.artifact.content, /Cutover approved/);
}

async function testKeepsPacketWarningWhenRunbookOrDecisionIsMissing() {
  const packet = await getTenantRolloutPacket({
    accessProfile: buildAccessProfile({
      organizationSlug: "tenant-yamal",
      role: "EXEC",
      workspaceId: "executive",
    }),
    now: () => new Date("2026-03-12T15:25:00.000Z"),
    overview: createOverview({
      latestDecision: null,
      latestRunbook: null,
      persistenceAvailable: false,
      summary: {
        completed: 0,
        draft: 0,
        prepared: 0,
        scheduled: 0,
        total: 0,
      },
    }),
  });

  assert.equal(packet.handoff.state, "warning");
  assert.equal(packet.handoff.stateLabel, "Runbook missing");
  assert.equal(packet.handoff.isRunbookBacked, false);
  assert.match(packet.artifact.content, /No persisted onboarding runbook exists yet\./);
  assert.equal(packet.sections.find((section) => section.id === "decision")?.state, "warning");
}

async function main() {
  await testBuildsRunbookBackedPacket();
  await testKeepsPacketWarningWhenRunbookOrDecisionIsMissing();

  console.log("tenant rollout packet service tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
