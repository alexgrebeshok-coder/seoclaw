import assert from "node:assert/strict";

import {
  buildOneCSampleUrl,
  fetchOneCFinanceSample,
  getOneCFinanceSampleSnapshot,
  getOneCFinanceTruthSnapshot,
} from "@/lib/connectors/one-c-client";

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function testBuildOneCSampleUrlUsesProjectFinancialsPath() {
  assert.equal(
    buildOneCSampleUrl("https://1c.example.com/api/v1"),
    "https://1c.example.com/api/v1/project-financials?page_size=3"
  );
  assert.equal(
    buildOneCSampleUrl("https://1c.example.com/api/v1/status"),
    "https://1c.example.com/api/v1/project-financials?page_size=3"
  );
}

async function testFinanceSampleNormalization() {
  let observedUrl = "";

  const result = await fetchOneCFinanceSample(
    {
      baseUrl: "https://1c.example.com/api/v1",
      apiKey: "1c-api-key",
    },
    (async (input: string | URL | Request) => {
      observedUrl = String(input);
      return createJsonResponse({
        provider: "1C:ERP",
        projects: [
          {
            project_id: "proj-yanao-001",
            project_name: "Yamal Earthwork Package",
            status: "watch",
            currency: "RUB",
            report_date: "2026-03-11",
            planned_budget: 125000000,
            actual_budget: 118000000,
            payments_actual: 79000000,
            acts_actual: 71000000,
          },
        ],
      });
    }) as typeof fetch
  );

  assert.equal(observedUrl, "https://1c.example.com/api/v1/project-financials?page_size=3");
  assert.equal(result.ok, true);

  if (!result.ok) {
    throw new Error("Expected 1C finance sample to parse successfully.");
  }

  assert.equal(result.samples.length, 1);
  assert.deepEqual(result.samples[0], {
    source: "one-c",
    projectId: "proj-yanao-001",
    projectName: "Yamal Earthwork Package",
    status: "watch",
    currency: "RUB",
    reportDate: "2026-03-11",
    plannedBudget: 125000000,
    actualBudget: 118000000,
    paymentsActual: 79000000,
    actsActual: 71000000,
    variance: 7000000,
    variancePercent: 0.056,
  });
}

async function testEmptyFinancePayloadReturnsFailure() {
  const result = await fetchOneCFinanceSample(
    {
      baseUrl: "https://1c.example.com/api/v1",
      apiKey: "1c-api-key",
    },
    (async () => createJsonResponse({ projects: [] })) as typeof fetch
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("Expected 1C finance sample to fail on empty project records.");
  }

  assert.match(result.message, /no project finance records/i);
}

async function testSnapshotStaysPendingWithoutSecrets() {
  const snapshot = await getOneCFinanceSampleSnapshot({} as NodeJS.ProcessEnv);

  assert.equal(snapshot.status, "pending");
  assert.equal(snapshot.configured, false);
  assert.deepEqual(snapshot.missingSecrets, ["ONE_C_BASE_URL", "ONE_C_API_KEY"]);
  assert.equal(snapshot.samples.length, 0);
}

async function testTruthSnapshotBuildsNormalizedFinanceDeltas() {
  let observedUrl = "";

  const snapshot = await getOneCFinanceTruthSnapshot(
    {
      env: {
        ONE_C_BASE_URL: "https://1c.example.com/api/v1",
        ONE_C_API_KEY: "1c-api-key",
      } as NodeJS.ProcessEnv,
      fetchImpl: (async (input: string | URL | Request) => {
        observedUrl = String(input);
        return createJsonResponse({
          provider: "1C:ERP",
          projects: [
            {
              project_id: "proj-yanao-002",
              project_name: "Northern Logistics Hub",
              status: "watch",
              currency: "RUB",
              report_date: "2026-03-12",
              planned_budget: 62000000,
              actual_budget: 65500000,
              payments_actual: 40200000,
              acts_actual: 38800000,
            },
            {
              project_id: "proj-yanao-001",
              project_name: "Yamal Earthwork Package",
              status: "in_progress",
              currency: "RUB",
              report_date: "2026-03-11",
              planned_budget: 125000000,
              actual_budget: 118000000,
              payments_actual: 79000000,
              acts_actual: 71000000,
            },
            {
              project_id: "proj-yanao-003",
              project_name: "Winter Road Package",
              status: "reported",
              currency: "RUB",
              report_date: "2026-03-10",
              planned_budget: 50000000,
              actual_budget: 50000000,
              payments_actual: 50000000,
              acts_actual: 49500000,
            },
          ],
        });
      }) as typeof fetch,
    }
  );

  assert.equal(observedUrl, "https://1c.example.com/api/v1/project-financials?page_size=12");
  assert.equal(snapshot.status, "ok");
  assert.equal(snapshot.summary.projectCount, 3);
  assert.equal(snapshot.summary.overPlanCount, 1);
  assert.equal(snapshot.summary.underPlanCount, 1);
  assert.equal(snapshot.summary.onPlanCount, 1);
  assert.equal(snapshot.summary.totalPlannedBudget, 237000000);
  assert.equal(snapshot.summary.totalActualBudget, 233500000);
  assert.equal(snapshot.summary.totalPaymentsActual, 169200000);
  assert.equal(snapshot.summary.totalActsActual, 159300000);
  assert.equal(snapshot.summary.totalBudgetVariance, 3500000);
  assert.equal(snapshot.summary.totalPaymentGap, 64300000);
  assert.equal(snapshot.summary.totalActGap, 74200000);
  assert.equal(snapshot.projects[0]?.projectId, "proj-yanao-002");
  assert.equal(snapshot.projects[0]?.budgetDeltaStatus, "over_plan");
  assert.equal(snapshot.projects[0]?.paymentGap, 25300000);
  assert.equal(snapshot.projects[1]?.projectId, "proj-yanao-001");
  assert.equal(snapshot.projects[1]?.budgetDeltaStatus, "under_plan");
  assert.equal(snapshot.projects[2]?.projectId, "proj-yanao-003");
  assert.equal(snapshot.projects[2]?.budgetDeltaStatus, "on_plan");
  assert.equal(snapshot.projects[2]?.actsToActualRatio, 0.99);
}

async function main() {
  await testBuildOneCSampleUrlUsesProjectFinancialsPath();
  await testFinanceSampleNormalization();
  await testEmptyFinancePayloadReturnsFailure();
  await testSnapshotStaysPendingWithoutSecrets();
  await testTruthSnapshotBuildsNormalizedFinanceDeltas();
  console.log("PASS one-c-client.unit");
}

void main();
