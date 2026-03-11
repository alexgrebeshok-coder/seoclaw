import assert from "node:assert/strict";

import { createOneCConnector } from "@/lib/connectors";

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function testMissingSecretsStayPending() {
  const connector = createOneCConnector({} as NodeJS.ProcessEnv);
  const status = await connector.getStatus();

  assert.equal(status.stub, false);
  assert.equal(status.configured, false);
  assert.equal(status.status, "pending");
  assert.deepEqual(status.missingSecrets, ["ONE_C_BASE_URL", "ONE_C_API_KEY"]);
}

async function testHealthyProbeReturnsOk() {
  let observedUrl = "";

  const connector = createOneCConnector(
    {
      ONE_C_BASE_URL: "https://1c.example.com/api/v1",
      ONE_C_API_KEY: "1c-api-key",
    } as NodeJS.ProcessEnv,
    (async (input: string | URL | Request) => {
      observedUrl = String(input);
      return createJsonResponse({
        provider: "1C:ERP",
        projects: [
          {
            project_id: "proj-yanao-001",
            project_name: "Yamal Earthwork Package",
            planned_budget: 125000000,
            actual_budget: 118000000,
            payments_actual: 79000000,
          },
        ],
      });
    }) as typeof fetch
  );

  const status = await connector.getStatus();

  assert.equal(observedUrl, "https://1c.example.com/api/v1/project-financials?page_size=1");
  assert.equal(status.status, "ok");
  assert.equal(status.configured, true);
  assert.equal(status.metadata?.provider, "1C:ERP");
  assert.equal(status.metadata?.projectCount, 1);
  assert.equal(status.metadata?.totalActualBudget, 118000000);
}

async function testRemoteDegradedStatusSurfacesHonestly() {
  const connector = createOneCConnector(
    {
      ONE_C_BASE_URL: "https://1c.example.com/api/v1/project-financials",
      ONE_C_API_KEY: "1c-api-key",
    } as NodeJS.ProcessEnv,
    (async () =>
      createJsonResponse({
        status: "degraded",
        projects: [
          {
            project_id: "proj-yanao-001",
            project_name: "Yamal Earthwork Package",
            planned_budget: 125000000,
            actual_budget: 118000000,
          },
        ],
      })) as typeof fetch
  );

  const status = await connector.getStatus();

  assert.equal(status.status, "degraded");
  assert.match(status.message, /reported degraded health/i);
  assert.equal(status.metadata?.remoteStatus, "degraded");
}

async function testHttpFailureReturnsDegraded() {
  const connector = createOneCConnector(
    {
      ONE_C_BASE_URL: "https://1c.example.com/api/v1",
      ONE_C_API_KEY: "1c-api-key",
    } as NodeJS.ProcessEnv,
    (async () => createJsonResponse({ error: "unauthorized" }, 401)) as typeof fetch
  );

  const status = await connector.getStatus();

  assert.equal(status.status, "degraded");
  assert.match(status.message, /HTTP 401/i);
}

async function main() {
  await testMissingSecretsStayPending();
  await testHealthyProbeReturnsOk();
  await testRemoteDegradedStatusSurfacesHonestly();
  await testHttpFailureReturnsDegraded();
  console.log("PASS one-c-connector.unit");
}

void main();
