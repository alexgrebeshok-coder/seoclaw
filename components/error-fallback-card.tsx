"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/contexts/locale-context";

export function ErrorFallbackCard({
  error,
  onReload,
  onRetry,
}: {
  error?: Error;
  onReload?: () => void;
  onRetry?: () => void;
}) {
  const { t } = useLocale();

  return (
    <Card className="border-rose-200 bg-[var(--surface-panel)]">
      <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-5 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            {t("error.title")}
          </h2>
          <p className="max-w-lg text-sm leading-6 text-[var(--ink-soft)]">
            {t("error.description")}
          </p>
          {error?.message ? (
            <p className="text-xs text-[var(--ink-muted)]">{error.message}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onRetry ? <Button onClick={onRetry}>{t("error.tryAgain")}</Button> : null}
          {onReload ? (
            <Button onClick={onReload} variant="secondary">
              <RotateCcw className="h-4 w-4" />
              {t("error.reload")}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
