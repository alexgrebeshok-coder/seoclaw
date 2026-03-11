import assert from "node:assert/strict";

import { createVideoFactSchema } from "@/lib/validators/video-fact";
import { createVideoFact, getVideoFactOverview } from "@/lib/video-facts/service";

type StoredDocument = {
  id: string;
  title: string;
  description: string | null;
  filename: string;
  url: string;
  type: string;
  size: number | null;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
};

type StoredEvidence = {
  id: string;
  sourceType: string;
  sourceRef: string | null;
  entityType: string;
  entityRef: string;
  projectId: string | null;
  title: string;
  summary: string | null;
  observedAt: Date;
  reportedAt: Date | null;
  confidence: number;
  verificationStatus: string;
  metadataJson: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function createReport(status: "approved" | "submitted" | "rejected") {
  return {
    id: `report-${status}`,
    reportNumber: `#20260311-${status}`,
    projectId: "project-1",
    section: "km 10+000",
    reportDate: new Date("2026-03-11T00:00:00.000Z"),
    status,
    project: {
      id: "project-1",
      name: "Arctic Road",
    },
  };
}

function createFakeStores() {
  const documents: StoredDocument[] = [];
  const evidenceRecords: StoredEvidence[] = [];

  return {
    documentStore: {
      async create(args: {
        data: {
          title: string;
          description?: string | null;
          filename: string;
          url: string;
          type: string;
          size?: number | null;
          projectId: string;
        };
      }) {
        const document: StoredDocument = {
          id: `doc-${documents.length + 1}`,
          title: args.data.title,
          description: args.data.description ?? null,
          filename: args.data.filename,
          url: args.data.url,
          type: args.data.type,
          size: args.data.size ?? null,
          projectId: args.data.projectId,
          createdAt: new Date("2026-03-11T14:00:00.000Z"),
          updatedAt: new Date("2026-03-11T14:00:00.000Z"),
        };
        documents.push(document);
        return document;
      },
    },
    evidenceStore: {
      async create(args: {
        data: Omit<StoredEvidence, "id" | "createdAt" | "updatedAt">;
      }) {
        const record: StoredEvidence = {
          id: `evidence-${evidenceRecords.length + 1}`,
          ...args.data,
          createdAt: new Date("2026-03-11T14:00:00.000Z"),
          updatedAt: new Date("2026-03-11T14:00:00.000Z"),
        };
        evidenceRecords.push(record);
        return record;
      },
      async findMany(args: {
        orderBy: { observedAt: "desc" };
        take: number;
        where?: { entityType?: string; projectId?: string };
      }) {
        return evidenceRecords
          .filter((record) => {
            if (args.where?.entityType && record.entityType !== args.where.entityType) {
              return false;
            }
            if (args.where?.projectId && record.projectId !== args.where.projectId) {
              return false;
            }
            return true;
          })
          .sort((left, right) => right.observedAt.getTime() - left.observedAt.getTime())
          .slice(0, args.take);
      },
    },
    reportStore: {
      async findUnique(args: { where: { id: string } }) {
        const id = args.where.id;
        if (id === "report-approved") return createReport("approved");
        if (id === "report-submitted") return createReport("submitted");
        if (id === "report-rejected") return createReport("rejected");
        return null;
      },
    },
    documents,
    evidenceRecords,
  };
}

async function testApprovedSameDayFactBecomesVerified() {
  const stores = createFakeStores();

  const fact = await createVideoFact(
    {
      reportId: "report-approved",
      url: "https://example.com/clip.mp4",
      capturedAt: "2026-03-11T08:30:00.000Z",
      observationType: "progress_visible",
    },
    {
      documentStore: stores.documentStore,
      evidenceStore: stores.evidenceStore,
      reportStore: stores.reportStore,
      now: () => new Date("2026-03-11T14:00:00.000Z"),
    }
  );

  assert.equal(fact.verificationStatus, "verified");
  assert.equal(fact.confidence, 0.91);
  assert.match(fact.verificationRule ?? "", /approved work report/i);
  assert.equal(stores.documents.length, 1);
  assert.equal(stores.evidenceRecords.length, 1);
}

async function testSubmittedFactStaysObserved() {
  const stores = createFakeStores();

  const fact = await createVideoFact(
    {
      reportId: "report-submitted",
      title: "Equipment standing still",
      url: "https://example.com/idle.mp4",
      capturedAt: "2026-03-12T08:30:00.000Z",
      observationType: "idle_equipment",
    },
    {
      documentStore: stores.documentStore,
      evidenceStore: stores.evidenceStore,
      reportStore: stores.reportStore,
      now: () => new Date("2026-03-11T14:00:00.000Z"),
    }
  );

  assert.equal(fact.verificationStatus, "observed");
  assert.equal(fact.confidence, 0.72);
  assert.equal(fact.title, "Equipment standing still");
}

async function testOverviewSummarizesRecentFacts() {
  const stores = createFakeStores();

  await createVideoFact(
    {
      reportId: "report-approved",
      url: "https://example.com/clip-1.mp4",
      capturedAt: "2026-03-11T08:30:00.000Z",
      observationType: "progress_visible",
    },
    {
      documentStore: stores.documentStore,
      evidenceStore: stores.evidenceStore,
      reportStore: stores.reportStore,
      now: () => new Date("2026-03-11T14:00:00.000Z"),
    }
  );

  await createVideoFact(
    {
      reportId: "report-rejected",
      url: "https://example.com/clip-2.mp4",
      capturedAt: "2026-03-12T08:30:00.000Z",
      observationType: "blocked_area",
    },
    {
      documentStore: stores.documentStore,
      evidenceStore: stores.evidenceStore,
      reportStore: stores.reportStore,
      now: () => new Date("2026-03-11T14:00:00.000Z"),
    }
  );

  const overview = await getVideoFactOverview(
    { limit: 10 },
    {
      evidenceStore: stores.evidenceStore,
      now: () => new Date("2026-03-11T14:00:00.000Z"),
    }
  );

  assert.equal(overview.summary.total, 2);
  assert.equal(overview.summary.verified, 1);
  assert.equal(overview.summary.observed, 1);
  assert.equal(overview.items[0]?.observationType, "blocked_area");
}

function testValidatorAcceptsVideoFactPayload() {
  const parsed = createVideoFactSchema.safeParse({
    reportId: "report-approved",
    url: "https://example.com/evidence.mp4",
    capturedAt: "2026-03-11T08:30:00.000Z",
    observationType: "progress_visible",
  });

  assert.equal(parsed.success, true);
}

async function main() {
  await testApprovedSameDayFactBecomesVerified();
  await testSubmittedFactStaysObserved();
  await testOverviewSummarizesRecentFacts();
  testValidatorAcceptsVideoFactPayload();
  console.log("PASS video-facts.service.unit");
}

void main();
