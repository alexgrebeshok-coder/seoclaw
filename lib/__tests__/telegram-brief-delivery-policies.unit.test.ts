import assert from "node:assert/strict";

import {
  executeTelegramPolicyRun,
  isSupportedTimeZone,
  shouldAttemptTelegramPolicy,
} from "@/lib/briefs/telegram-delivery-policies";

function testSupportsIanaTimeZones() {
  assert.equal(isSupportedTimeZone("UTC"), true);
  assert.equal(isSupportedTimeZone("Europe/Moscow"), true);
  assert.equal(isSupportedTimeZone("Mars/Olympus"), false);
}

function testDueWindowMatchesLocalHour() {
  const due = shouldAttemptTelegramPolicy(
    {
      id: "policy-1",
      scope: "portfolio",
      projectId: null,
      locale: "ru",
      chatId: null,
      cadence: "daily",
      timezone: "UTC",
      deliveryHour: 9,
      active: true,
      lastAttemptAt: null,
    },
    new Date("2026-03-11T09:05:00.000Z")
  );

  const skippedSameWindow = shouldAttemptTelegramPolicy(
    {
      id: "policy-2",
      scope: "portfolio",
      projectId: null,
      locale: "ru",
      chatId: null,
      cadence: "daily",
      timezone: "UTC",
      deliveryHour: 9,
      active: true,
      lastAttemptAt: "2026-03-11T09:00:00.000Z",
    },
    new Date("2026-03-11T09:55:00.000Z")
  );

  const skippedWrongHour = shouldAttemptTelegramPolicy(
    {
      id: "policy-3",
      scope: "portfolio",
      projectId: null,
      locale: "ru",
      chatId: null,
      cadence: "daily",
      timezone: "UTC",
      deliveryHour: 10,
      active: true,
      lastAttemptAt: null,
    },
    new Date("2026-03-11T09:05:00.000Z")
  );

  const retriedFailedWindow = shouldAttemptTelegramPolicy(
    {
      id: "policy-6",
      scope: "portfolio",
      projectId: null,
      locale: "ru",
      chatId: null,
      cadence: "daily",
      timezone: "UTC",
      deliveryHour: 9,
      active: true,
      lastAttemptAt: "2026-03-11T09:00:00.000Z",
      lastDeliveredAt: null,
      lastError: "Telegram delivery failed.",
    },
    new Date("2026-03-11T09:20:00.000Z")
  );

  assert.equal(due, true);
  assert.equal(skippedSameWindow, false);
  assert.equal(skippedWrongHour, false);
  assert.equal(retriedFailedWindow, true);
}

function testWeekdayCadenceSkipsWeekend() {
  const saturday = shouldAttemptTelegramPolicy(
    {
      id: "policy-4",
      scope: "portfolio",
      projectId: null,
      locale: "ru",
      chatId: null,
      cadence: "weekdays",
      timezone: "UTC",
      deliveryHour: 9,
      active: true,
      lastAttemptAt: null,
    },
    new Date("2026-03-14T09:00:00.000Z")
  );

  const monday = shouldAttemptTelegramPolicy(
    {
      id: "policy-5",
      scope: "portfolio",
      projectId: null,
      locale: "ru",
      chatId: null,
      cadence: "weekdays",
      timezone: "UTC",
      deliveryHour: 9,
      active: true,
      lastAttemptAt: null,
    },
    new Date("2026-03-16T09:00:00.000Z")
  );

  assert.equal(saturday, false);
  assert.equal(monday, true);
}

async function testExecutionSummarizesSuccessAndFailure() {
  const persisted: Array<{
    policyId: string;
    attemptedAt: Date;
    deliveredAt?: Date | null;
    messageId?: number | null;
    error?: string | null;
  }> = [];
  const deliveredRequests: string[] = [];

  const summary = await executeTelegramPolicyRun(
    [
      {
        id: "success-policy",
        scope: "portfolio",
        projectId: null,
        locale: "ru",
        chatId: "-1001",
        cadence: "daily",
        timezone: "UTC",
        deliveryHour: 9,
        active: true,
        lastAttemptAt: null,
      },
      {
        id: "inactive-policy",
        scope: "portfolio",
        projectId: null,
        locale: "ru",
        chatId: null,
        cadence: "daily",
        timezone: "UTC",
        deliveryHour: 9,
        active: false,
        lastAttemptAt: null,
      },
      {
        id: "failed-policy",
        scope: "project",
        projectId: "p6",
        locale: "en",
        chatId: "-1002",
        cadence: "daily",
        timezone: "UTC",
        deliveryHour: 9,
        active: true,
        lastAttemptAt: null,
      },
      {
        id: "not-due-policy",
        scope: "portfolio",
        projectId: null,
        locale: "ru",
        chatId: null,
        cadence: "daily",
        timezone: "UTC",
        deliveryHour: 7,
        active: true,
        lastAttemptAt: null,
      },
    ],
    {
      now: new Date("2026-03-11T09:00:00.000Z"),
      deliver: async (request) => {
        deliveredRequests.push(request.scope === "project" ? request.projectId ?? "missing" : "portfolio");
        if (request.scope === "project") {
          throw new Error("Telegram delivery failed.");
        }

        return {
          messageId: 88,
        };
      },
      persistResult: async (result) => {
        persisted.push(result);
      },
    }
  );

  assert.equal(summary.checkedPolicies, 4);
  assert.equal(summary.duePolicies, 2);
  assert.equal(summary.deliveredPolicies, 1);
  assert.equal(summary.failedPolicies, 1);
  assert.equal(summary.skippedPolicies, 2);
  assert.deepEqual(deliveredRequests, ["portfolio", "p6"]);
  assert.equal(persisted.length, 2);
  assert.equal(persisted[0]?.policyId, "success-policy");
  assert.equal(persisted[0]?.messageId, 88);
  assert.equal(persisted[0]?.error, null);
  assert.equal(persisted[1]?.policyId, "failed-policy");
  assert.match(persisted[1]?.error ?? "", /Telegram delivery failed/);
}

async function main() {
  testSupportsIanaTimeZones();
  testDueWindowMatchesLocalHour();
  testWeekdayCadenceSkipsWeekend();
  await testExecutionSummarizesSuccessAndFailure();
  console.log("PASS telegram-brief-delivery-policies.unit");
}

void main();
