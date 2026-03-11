import assert from "node:assert/strict";

import { deliverBriefByEmail } from "@/lib/briefs/email-delivery";

async function testDryRunReturnsEmailPreview() {
  const result = await deliverBriefByEmail(
    {
      scope: "portfolio",
      locale: "ru",
      dryRun: true,
    },
    {
      generatePortfolio: async () =>
        ({
          headline: "Портфельный сигнал",
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
    }
  );

  assert.equal(result.scope, "portfolio");
  assert.equal(result.delivered, false);
  assert.equal(result.dryRun, true);
  assert.equal(result.subject, "Executive brief");
  assert.equal(result.bodyText, "Body");
}

async function testSendUsesDefaultRecipient() {
  let sendPayload:
    | {
        to: string;
        subject: string;
        text: string;
        config: { from: string; host: string };
      }
    | null = null;

  const result = await deliverBriefByEmail(
    {
      scope: "project",
      projectId: "p6",
      locale: "en",
    },
    {
      env: {
        EMAIL_FROM: "ceoclaw@example.com",
        EMAIL_DEFAULT_TO: "hq@example.com",
        SMTP_HOST: "smtp.example.com",
        SMTP_USER: "smtp-user",
        SMTP_PASSWORD: "smtp-password",
      } as NodeJS.ProcessEnv,
      generatePortfolio: async () => {
        throw new Error("should not be called");
      },
      generateProject: async () =>
        ({
          headline: "Project signal",
          formats: {
            emailDigest: {
              subject: "Project brief",
              preview: "Project preview",
              body: "Project body",
            },
          },
        }) as never,
      sendMessage: async (input) => {
        sendPayload = {
          to: input.to,
          subject: input.subject,
          text: input.text,
          config: {
            from: input.config.from,
            host: input.config.host,
          },
        };

        return {
          ok: true,
          messageId: "smtp-message-88",
        };
      },
    }
  );

  assert.equal(result.delivered, true);
  assert.equal(result.recipient, "hq@example.com");
  assert.equal(result.messageId, "smtp-message-88");
  assert.deepEqual(sendPayload, {
    to: "hq@example.com",
    subject: "Project brief",
    text: "Project body",
    config: {
      from: "ceoclaw@example.com",
      host: "smtp.example.com",
    },
  });
}

async function testSendRequiresRecipientWithoutDefault() {
  await assert.rejects(
    () =>
      deliverBriefByEmail(
        {
          scope: "portfolio",
          locale: "ru",
        },
        {
          env: {
            EMAIL_FROM: "ceoclaw@example.com",
            SMTP_HOST: "smtp.example.com",
            SMTP_USER: "smtp-user",
            SMTP_PASSWORD: "smtp-password",
          } as NodeJS.ProcessEnv,
          generatePortfolio: async () =>
            ({
              headline: "Portfolio signal",
              formats: {
                emailDigest: {
                  subject: "Portfolio brief",
                  preview: "Portfolio preview",
                  body: "Portfolio body",
                },
              },
            }) as never,
        }
      ),
    /recipient is required/i
  );
}

async function testSendPropagatesSmtpFailure() {
  await assert.rejects(
    () =>
      deliverBriefByEmail(
        {
          scope: "portfolio",
          locale: "ru",
          recipient: "owner@example.com",
        },
        {
          env: {
            EMAIL_FROM: "ceoclaw@example.com",
            SMTP_HOST: "smtp.example.com",
            SMTP_USER: "smtp-user",
            SMTP_PASSWORD: "smtp-password",
          } as NodeJS.ProcessEnv,
          generatePortfolio: async () =>
            ({
              headline: "Portfolio signal",
              formats: {
                emailDigest: {
                  subject: "Portfolio brief",
                  preview: "Portfolio preview",
                  body: "Portfolio body",
                },
              },
            }) as never,
          sendMessage: async () => ({
            ok: false,
            message: "SMTP delivery failed: auth rejected",
          }),
        }
      ),
    /SMTP delivery failed: auth rejected/
  );
}

async function main() {
  await testDryRunReturnsEmailPreview();
  await testSendUsesDefaultRecipient();
  await testSendRequiresRecipientWithoutDefault();
  await testSendPropagatesSmtpFailure();
  console.log("PASS email-brief-delivery.unit");
}

void main();
