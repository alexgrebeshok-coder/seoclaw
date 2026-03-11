import assert from "node:assert/strict";

import {
  buildOneCSampleUrl,
  fetchOneCFinanceSample,
  getOneCFinanceSampleSnapshot,
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

async function main() {
  await testBuildOneCSampleUrlUsesProjectFinancialsPath();
  await testFinanceSampleNormalization();
  await testEmptyFinancePayloadReturnsFailure();
  await testSnapshotStaysPendingWithoutSecrets();
  console.log("PASS one-c-client.unit");
}

void main();
