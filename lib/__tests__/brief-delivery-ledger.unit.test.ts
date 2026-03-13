import assert from "node:assert/strict";

import { deliverBriefByEmail } from "@/lib/briefs/email-delivery";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/server/runtime-mode";

const databaseConfigured = isDatabaseConfigured();

async function cleanupByKey(idempotencyKey: string) {
  if (!databaseConfigured) {
    return;
  }

  await prisma.deliveryLedger.deleteMany({
    where: { idempotencyKey },
  });
}

function createEmailEnv() {
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    EMAIL_FROM: "ceoclaw@example.com",
    EMAIL_DEFAULT_TO: "hq@example.com",
    SMTP_HOST: "smtp.example.com",
    SMTP_USER: "smtp-user",
    SMTP_PASSWORD: "smtp-password",
  } as NodeJS.ProcessEnv;
}

async function testRepeatSendReplaysDeliveredLedger() {
  if (!databaseConfigured) {
    return;
  }

  const idempotencyKey = `email-repeat-${Date.now()}`;
  let sendCount = 0;

  try {
    const first = await deliverBriefByEmail(
      {
        scope: "portfolio",
        locale: "ru",
        idempotencyKey,
      },
      {
        env: createEmailEnv(),
        generatePortfolio: async () =>
          ({
            headline: "Portfolio signal",
            formats: {
              emailDigest: {
                subject: "Executive brief",
                preview: "Preview",
                body: "Body",
              },
            },
          }) as never,
        generateProject: async () => {
          throw new Error("should not be called");
        },
        sendMessage: async () => {
          sendCount += 1;
          return {
            ok: true,
            messageId: `smtp-message-${sendCount}`,
          };
        },
      }
    );

    const second = await deliverBriefByEmail(
      {
        scope: "portfolio",
        locale: "ru",
        idempotencyKey,
      },
      {
        env: createEmailEnv(),
        generatePortfolio: async () =>
          ({
            headline: "Portfolio signal",
            formats: {
              emailDigest: {
                subject: "Executive brief",
                preview: "Preview",
                body: "Body",
              },
            },
          }) as never,
        generateProject: async () => {
          throw new Error("should not be called");
        },
        sendMessage: async () => {
          sendCount += 1;
          return {
            ok: true,
            messageId: `smtp-message-${sendCount}`,
          };
        },
      }
    );

    assert.equal(sendCount, 1);
    assert.equal(first.replayed, false);
    assert.equal(second.replayed, true);
    assert.equal(second.messageId, "smtp-message-1");
    assert.equal(second.ledger?.status, "delivered");
    assert.equal(second.ledger?.attemptCount, 1);
    assert.equal(second.ledger?.retryPosture, "sealed");
  } finally {
    await cleanupByKey(idempotencyKey);
  }
}

async function testFailedSendCanRetrySameLedger() {
  if (!databaseConfigured) {
    return;
  }

  const idempotencyKey = `email-retry-${Date.now()}`;
  let sendCount = 0;
  let shouldFail = true;

  try {
    await assert.rejects(
      () =>
        deliverBriefByEmail(
          {
            scope: "portfolio",
            locale: "ru",
            idempotencyKey,
          },
          {
            env: createEmailEnv(),
            generatePortfolio: async () =>
              ({
                headline: "Portfolio signal",
                formats: {
                  emailDigest: {
                    subject: "Executive brief",
                    preview: "Preview",
                    body: "Body",
                  },
                },
              }) as never,
            generateProject: async () => {
              throw new Error("should not be called");
            },
            sendMessage: async () => {
              sendCount += 1;
              if (shouldFail) {
                return {
                  ok: false,
                  message: "SMTP delivery failed: temporary outage",
                };
              }

              return {
                ok: true,
                messageId: "smtp-message-recovered",
              };
            },
          }
        ),
      /temporary outage/
    );

    const failed = await prisma.deliveryLedger.findUnique({
      where: { idempotencyKey },
    });

    assert.equal(failed?.status, "failed");
    assert.equal(failed?.attemptCount, 1);
    assert.equal(failed?.retryPosture, "retryable");

    shouldFail = false;

    const retried = await deliverBriefByEmail(
      {
        scope: "portfolio",
        locale: "ru",
        idempotencyKey,
      },
      {
        env: createEmailEnv(),
        generatePortfolio: async () =>
          ({
            headline: "Portfolio signal",
            formats: {
              emailDigest: {
                subject: "Executive brief",
                preview: "Preview",
                body: "Body",
              },
            },
          }) as never,
        generateProject: async () => {
          throw new Error("should not be called");
        },
        sendMessage: async () => {
          sendCount += 1;
          if (shouldFail) {
            return {
              ok: false,
              message: "SMTP delivery failed: temporary outage",
            };
          }

          return {
            ok: true,
            messageId: "smtp-message-recovered",
          };
        },
      }
    );

    assert.equal(sendCount, 2);
    assert.equal(retried.replayed, false);
    assert.equal(retried.messageId, "smtp-message-recovered");
    assert.equal(retried.ledger?.status, "delivered");
    assert.equal(retried.ledger?.attemptCount, 2);
    assert.equal(retried.ledger?.retryPosture, "sealed");
  } finally {
    await cleanupByKey(idempotencyKey);
  }
}

async function main() {
  if (!databaseConfigured) {
    console.log("SKIP brief-delivery-ledger.unit (DATABASE_URL not configured)");
    return;
  }

  await testRepeatSendReplaysDeliveredLedger();
  await testFailedSendCanRetrySameLedger();
  console.log("PASS brief-delivery-ledger.unit");
}

void main();
