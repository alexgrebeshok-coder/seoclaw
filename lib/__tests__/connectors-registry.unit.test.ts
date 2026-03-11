import assert from "node:assert/strict";

import {
  ConnectorRegistry,
  createConnectorRegistry,
  createTelegramConnector,
  summarizeConnectorStatuses,
} from "../connectors";
import { setEmailTransportFactoryForTests } from "../connectors/email-client";

type MockResponse = {
  body: unknown;
  status?: number;
};

function createJsonResponse({ body, status = 200 }: MockResponse): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function installTelegramFetchMock() {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);

    if (url.includes("/getMe")) {
      return createJsonResponse({
        ok: true,
        body: {
          ok: true,
          result: {
            id: 777000,
            is_bot: true,
            first_name: "CEOClaw Bot",
            username: "ceoclaw_bot",
            can_join_groups: true,
            supports_inline_queries: false,
          },
        },
      });
    }

    if (url.includes("/getWebhookInfo")) {
      return createJsonResponse({
        body: {
          ok: true,
          result: {
            url: "https://example.com/api/telegram/webhook",
            pending_update_count: 0,
            has_custom_certificate: false,
          },
        },
      });
    }

    if (url.includes("gps.example.com") && url.includes("/session-stats")) {
      return createJsonResponse({
        body: {
          status: "ok",
          provider: "Teltonika Gateway",
          total_equipment: 68,
          online_equipment: 61,
          offline_equipment: 7,
          active_alerts: 2,
        },
      });
    }

    if (url.includes("1c.example.com") && url.includes("/project-financials")) {
      return createJsonResponse({
        body: {
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
        },
      });
    }

    throw new Error(`Unexpected fetch call: ${url}`);
  }) as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

async function run() {
  const restoreFetch = installTelegramFetchMock();
  setEmailTransportFactoryForTests(() => ({
    async verify() {},
    async sendMail() {
      throw new Error("sendMail should not be called in registry tests");
    },
  }));

  try {
    const fullyConfiguredEnv = {
      TELEGRAM_BOT_TOKEN: "telegram-token",
      EMAIL_FROM: "ceoclaw@example.com",
      SMTP_HOST: "smtp.example.com",
      SMTP_USER: "smtp-user",
      SMTP_PASSWORD: "smtp-password",
      GPS_API_URL: "https://gps.example.com/api/v1",
      GPS_API_KEY: "gps-api-key",
      ONE_C_BASE_URL: "https://1c.example.com/api/v1",
      ONE_C_API_KEY: "1c-api-key",
    } as NodeJS.ProcessEnv;

    const registry = createConnectorRegistry(fullyConfiguredEnv);
    const statuses = await registry.getStatuses();

    assert.deepEqual(
      statuses.map((connector) => connector.id),
      ["telegram", "email", "gps", "one-c"]
    );
    assert.equal(statuses.length, 4);

    for (const connector of statuses) {
      assert.equal(connector.configured, true);
      assert.equal(connector.status, "ok");
      assert.deepEqual(connector.missingSecrets, []);
      assert.ok(connector.apiSurface.length > 0);
    }

    const telegramStatus = statuses.find((connector) => connector.id === "telegram");
    assert.ok(telegramStatus);
    assert.equal(telegramStatus?.stub, false);
    assert.equal(telegramStatus?.metadata?.webhookConfigured, true);

    const gpsStatus = statuses.find((connector) => connector.id === "gps");
    assert.ok(gpsStatus);
    assert.equal(gpsStatus?.stub, false);
    assert.equal(gpsStatus?.metadata?.equipmentCount, 68);

    const oneCStatus = statuses.find((connector) => connector.id === "one-c");
    assert.ok(oneCStatus);
    assert.equal(oneCStatus?.stub, false);
    assert.equal(oneCStatus?.metadata?.projectCount, 1);

    const emailStatus = statuses.find((connector) => connector.id === "email");
    assert.ok(emailStatus);
    assert.equal(emailStatus?.stub, false);
    assert.equal(emailStatus?.metadata?.host, "smtp.example.com");
    assert.equal(emailStatus?.metadata?.sender, "ceoclaw@example.com");

    const telegram = await registry.getStatus("telegram");
    assert.ok(telegram);
    assert.equal(telegram?.apiSurface[0]?.path, "/api/telegram/webhook");

    assert.equal(await registry.getStatus("missing"), null);

    const okSummary = summarizeConnectorStatuses(statuses);
    assert.deepEqual(okSummary, {
      status: "ok",
      total: 4,
      configured: 4,
      ok: 4,
      pending: 0,
      degraded: 0,
    });

    const duplicateRegistry = new ConnectorRegistry().register(
      createTelegramConnector({} as NodeJS.ProcessEnv)
    );
    assert.throws(
      () => duplicateRegistry.register(createTelegramConnector({} as NodeJS.ProcessEnv)),
      /already registered/
    );

    const partiallyConfiguredRegistry = createConnectorRegistry({
      TELEGRAM_BOT_TOKEN: "telegram-token",
    } as NodeJS.ProcessEnv);
    const partiallyConfiguredStatuses = await partiallyConfiguredRegistry.getStatuses();
    const pendingSummary = summarizeConnectorStatuses(partiallyConfiguredStatuses);
    const gps = partiallyConfiguredStatuses.find((connector) => connector.id === "gps");

    assert.equal(pendingSummary.status, "pending");
    assert.equal(pendingSummary.configured, 1);
    assert.equal(pendingSummary.pending, 3);
    assert.deepEqual(gps?.missingSecrets, ["GPS_API_URL", "GPS_API_KEY"]);

    console.log("PASS connectors-registry.unit");
  } finally {
    setEmailTransportFactoryForTests(null);
    restoreFetch();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
