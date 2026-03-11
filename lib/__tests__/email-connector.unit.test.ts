import assert from "node:assert/strict";

import { createEmailConnector } from "@/lib/connectors";

async function testMissingSecretsStayPending() {
  const connector = createEmailConnector({} as NodeJS.ProcessEnv);
  const status = await connector.getStatus();

  assert.equal(status.stub, false);
  assert.equal(status.configured, false);
  assert.equal(status.status, "pending");
  assert.deepEqual(status.missingSecrets, [
    "EMAIL_FROM",
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASSWORD",
  ]);
}

async function testHealthyProbeReturnsOk() {
  let verifyCalls = 0;

  const connector = createEmailConnector(
    {
      EMAIL_FROM: "ceoclaw@example.com",
      EMAIL_DEFAULT_TO: "hq@example.com",
      SMTP_HOST: "smtp.example.com",
      SMTP_USER: "smtp-user",
      SMTP_PASSWORD: "smtp-password",
    } as NodeJS.ProcessEnv,
    () => ({
      async verify() {
        verifyCalls += 1;
      },
      async sendMail() {
        throw new Error("should not be called");
      },
    })
  );

  const status = await connector.getStatus();

  assert.equal(verifyCalls, 1);
  assert.equal(status.status, "ok");
  assert.equal(status.configured, true);
  assert.equal(status.metadata?.host, "smtp.example.com");
  assert.equal(status.metadata?.sender, "ceoclaw@example.com");
}

async function testProbeFailureReturnsDegraded() {
  const connector = createEmailConnector(
    {
      EMAIL_FROM: "ceoclaw@example.com",
      SMTP_HOST: "smtp.example.com",
      SMTP_USER: "smtp-user",
      SMTP_PASSWORD: "smtp-password",
    } as NodeJS.ProcessEnv,
    () => ({
      async verify() {
        throw new Error("auth rejected");
      },
      async sendMail() {
        throw new Error("should not be called");
      },
    })
  );

  const status = await connector.getStatus();

  assert.equal(status.status, "degraded");
  assert.match(status.message, /auth rejected/);
}

async function main() {
  await testMissingSecretsStayPending();
  await testHealthyProbeReturnsOk();
  await testProbeFailureReturnsDegraded();
  console.log("PASS email-connector.unit");
}

void main();
