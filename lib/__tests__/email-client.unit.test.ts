import assert from "node:assert/strict";

import {
  getEmailConnectorConfig,
  getEmailConnectorMissingSecrets,
  getSmtpPort,
  getSmtpSecure,
  probeEmailTransport,
  sendEmailTextMessage,
} from "@/lib/connectors/email-client";

function testMissingSecretsAndDefaults() {
  assert.deepEqual(getEmailConnectorMissingSecrets({} as NodeJS.ProcessEnv), [
    "EMAIL_FROM",
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASSWORD",
  ]);

  assert.equal(
    getSmtpPort({
      SMTP_SECURE: "true",
    } as NodeJS.ProcessEnv),
    465
  );
  assert.equal(
    getSmtpSecure({
      SMTP_PORT: "465",
    } as NodeJS.ProcessEnv),
    true
  );
}

async function testProbeReturnsOk() {
  let verifyCalls = 0;

  const result = await probeEmailTransport(
    {
      from: "ceoclaw@example.com",
      defaultTo: "hq@example.com",
      host: "smtp.example.com",
      port: 587,
      secure: false,
      user: "smtp-user",
      password: "smtp-password",
    },
    () => ({
      async verify() {
        verifyCalls += 1;
      },
      async sendMail() {
        throw new Error("should not be called");
      },
    })
  );

  assert.equal(verifyCalls, 1);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.remoteStatus, "ok");
    assert.equal(result.metadata.host, "smtp.example.com");
    assert.equal(result.metadata.defaultRecipient, "hq@example.com");
  }
}

async function testSendUsesConfiguredEnvelope() {
  let payload: { from: string; to: string; subject: string; text: string } | null = null;

  const config = getEmailConnectorConfig({
    EMAIL_FROM: "ceoclaw@example.com",
    EMAIL_DEFAULT_TO: "hq@example.com",
    SMTP_HOST: "smtp.example.com",
    SMTP_USER: "smtp-user",
    SMTP_PASSWORD: "smtp-password",
  } as NodeJS.ProcessEnv);

  assert.ok(config);

  const result = await sendEmailTextMessage(
    {
      config: config!,
      to: "owner@example.com",
      subject: "Executive brief",
      text: "Body",
    },
    () => ({
      async verify() {
        throw new Error("should not be called");
      },
      async sendMail(input) {
        payload = input;
        return { messageId: "message-77" };
      },
    })
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.messageId, "message-77");
  }
  assert.deepEqual(payload, {
    from: "ceoclaw@example.com",
    to: "owner@example.com",
    subject: "Executive brief",
    text: "Body",
  });
}

async function testSendPropagatesFailure() {
  const result = await sendEmailTextMessage(
    {
      config: {
        from: "ceoclaw@example.com",
        defaultTo: null,
        host: "smtp.example.com",
        port: 587,
        secure: false,
        user: "smtp-user",
        password: "smtp-password",
      },
      to: "owner@example.com",
      subject: "Executive brief",
      text: "Body",
    },
    () => ({
      async verify() {
        throw new Error("should not be called");
      },
      async sendMail() {
        throw new Error("invalid login");
      },
    })
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /SMTP delivery failed: invalid login/);
  }
}

async function main() {
  testMissingSecretsAndDefaults();
  await testProbeReturnsOk();
  await testSendUsesConfiguredEnvelope();
  await testSendPropagatesFailure();
  console.log("PASS email-client.unit");
}

void main();
