"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, fieldStyles } from "@/components/ui/field";
import type { BriefDeliveryLedgerRecord } from "@/lib/briefs/delivery-ledger";

type DeliveryScope = "portfolio" | "project";
type DeliveryLocale = "ru" | "en";

function createDeliveryKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `email-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

interface DeliveryResponse {
  scope: DeliveryScope;
  locale: DeliveryLocale;
  recipient: string | null;
  headline: string;
  delivered: boolean;
  dryRun: boolean;
  subject: string;
  previewText: string;
  bodyText: string;
  messageId?: string;
  replayed?: boolean;
  ledger?: BriefDeliveryLedgerRecord | null;
}

export function EmailBriefDeliveryPanel({
  projectOptions,
}: {
  projectOptions: Array<{ id: string; name: string }>;
}) {
  const [scope, setScope] = useState<DeliveryScope>("portfolio");
  const [projectId, setProjectId] = useState(projectOptions[0]?.id ?? "");
  const [locale, setLocale] = useState<DeliveryLocale>("ru");
  const [recipient, setRecipient] = useState("");
  const [result, setResult] = useState<DeliveryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(createDeliveryKey);
  const selectedProject = projectOptions.find((project) => project.id === projectId) ?? null;
  const scopeOptions = useMemo(
    () =>
      projectOptions.length > 0
        ? [
            { value: "portfolio" as const, label: "Portfolio brief" },
            {
              value: "project" as const,
              label: selectedProject
                ? `Project brief · ${selectedProject.name}`
                : "Project brief",
            },
          ]
        : [{ value: "portfolio" as const, label: "Portfolio brief" }],
    [projectOptions.length, selectedProject]
  );

  useEffect(() => {
    if (!projectId && projectOptions[0]?.id) {
      setProjectId(projectOptions[0].id);
    }

    if (scope === "project" && projectOptions.length === 0) {
      setScope("portfolio");
    }
  }, [projectId, projectOptions, scope]);

  useEffect(() => {
    setIdempotencyKey(createDeliveryKey());
  }, [scope, projectId, locale, recipient]);

  const submit = async (dryRun: boolean) => {
    setError(null);

    if (dryRun) {
      setIsPreviewing(true);
    } else {
      setIsSending(true);
    }

    try {
      const response = await fetch("/api/connectors/email/briefs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scope,
          projectId: scope === "project" ? projectId : undefined,
          locale,
          recipient: recipient.trim() || undefined,
          idempotencyKey,
          dryRun,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to deliver email brief.");
      }

      setResult(payload as DeliveryResponse);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to deliver email brief."
      );
    } finally {
      setIsPreviewing(false);
      setIsSending(false);
    }
  };

  return (
    <div className="mt-4 grid gap-4 rounded-[14px] border border-[var(--line)] bg-[var(--surface-panel-strong)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-[var(--ink)]">Email delivery</div>
          <div className="mt-1 text-xs text-[var(--ink-soft)]">
            Preview or deliver the current executive brief through the live SMTP connector.
          </div>
        </div>
        <Badge variant="success">Live connector</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
          <span>Scope</span>
          <select
            className={fieldStyles}
            onChange={(event) => setScope(event.target.value as DeliveryScope)}
            value={scope}
          >
            {scopeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
          <span>Locale</span>
          <select
            className={fieldStyles}
            onChange={(event) => setLocale(event.target.value as DeliveryLocale)}
            value={locale}
          >
            <option value="ru">ru</option>
            <option value="en">en</option>
          </select>
        </label>
      </div>

      {scope === "project" && projectOptions.length > 0 ? (
        <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
          <span>Project</span>
          <select
            className={fieldStyles}
            onChange={(event) => setProjectId(event.target.value)}
            value={projectId}
          >
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="grid gap-2 text-sm text-[var(--ink-soft)]">
        <span>Recipient email</span>
        <Input
          onChange={(event) => setRecipient(event.target.value)}
          placeholder="Optional if EMAIL_DEFAULT_TO is configured"
          value={recipient}
        />
      </label>

      {error ? (
        <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          disabled={isPreviewing || isSending || (scope === "project" && !projectId)}
          onClick={() => submit(true)}
          variant="secondary"
        >
          {isPreviewing ? "Previewing..." : "Preview Email"}
        </Button>
        <Button
          disabled={isPreviewing || isSending || (scope === "project" && !projectId)}
          onClick={() => submit(false)}
        >
          {isSending ? "Sending..." : "Send Email"}
        </Button>
      </div>

      {result ? (
        <div className="grid gap-3 rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={result.delivered ? "success" : "info"}>
              {result.delivered ? "Delivered" : "Preview"}
            </Badge>
            {result.replayed ? <Badge variant="warning">Idempotent replay</Badge> : null}
            <span className="text-xs text-[var(--ink-soft)]">
              {result.scope} · {result.locale} · {result.recipient ?? "env default / not set"}
            </span>
          </div>
          <div className="text-sm font-medium text-[var(--ink)]">{result.subject}</div>
          {result.ledger ? (
            <div className="text-xs text-[var(--ink-soft)]">
              Ledger {result.ledger.status} · attempts {result.ledger.attemptCount} · retry{" "}
              {result.ledger.retryPosture}
              {result.ledger.providerMessageId ? ` · provider ${result.ledger.providerMessageId}` : ""}
            </div>
          ) : null}
          <div className="text-xs text-[var(--ink-soft)]">{result.previewText}</div>
          <pre className="whitespace-pre-wrap text-xs leading-6 text-[var(--ink-soft)]">
            {result.bodyText}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
