"use client";

import { TrendingUp, TrendingDown, Minus, DollarSign, Clock, Shield, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/contexts/locale-context";
import type { HealthScore } from "@/lib/ai/health-calculator";

interface PortfolioHealthCardProps {
  healthScore: HealthScore;
  isLoading?: boolean;
}

function getHealthColor(score: number): "success" | "warning" | "danger" {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "danger";
}

function getHealthLabel(score: number, t: ReturnType<typeof useLocale>["t"]): string {
  if (score >= 80) return t("portfolioHealth.excellent");
  if (score >= 60) return t("portfolioHealth.good");
  return t("portfolioHealth.poor");
}

function getHealthTrendIcon(score: number) {
  if (score >= 80) return TrendingUp;
  if (score >= 60) return Minus;
  return TrendingDown;
}

export function PortfolioHealthCard({ healthScore, isLoading }: PortfolioHealthCardProps) {
  const { t } = useLocale();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("portfolioHealth.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-[10px] bg-[var(--panel-soft)]" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthColor = getHealthColor(healthScore.overall);
  const healthLabel = getHealthLabel(healthScore.overall, t);
  const HealthTrendIcon = getHealthTrendIcon(healthScore.overall);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {t("portfolioHealth.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Overall Health Score */}
        <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant={healthColor} className="text-sm">
                <HealthTrendIcon className="mr-1 h-3 w-3" />
                {healthLabel}
              </Badge>
              <span className="text-xs text-[var(--ink-soft)]">
                {t("portfolioHealth.score")}
              </span>
            </div>
          </div>
          <div className="text-center">
            <div className="font-heading text-[4rem] font-semibold tracking-[-0.1em] leading-none text-[var(--ink)]">
              {healthScore.overall}
            </div>
            <div className="mt-2 text-sm text-[var(--ink-soft)]">
              {t("portfolioHealth.score")}
            </div>
          </div>
        </div>

        {/* Sub-metrics with Progress Bars */}
        <div className="space-y-4">
          {/* Budget Health */}
          <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[var(--brand)]" />
                <span className="text-sm font-medium text-[var(--ink-soft)]">
                  {t("portfolioHealth.budgetHealth")}
                </span>
              </div>
              <Badge variant={getHealthColor(healthScore.budget)} className="text-xs">
                {healthScore.budget}%
              </Badge>
            </div>
            <Progress value={healthScore.budget} className="h-2" />
          </div>

          {/* Schedule Health */}
          <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[var(--brand)]" />
                <span className="text-sm font-medium text-[var(--ink-soft)]">
                  {t("portfolioHealth.scheduleHealth")}
                </span>
              </div>
              <Badge variant={getHealthColor(healthScore.schedule)} className="text-xs">
                {healthScore.schedule}%
              </Badge>
            </div>
            <Progress value={healthScore.schedule} className="h-2" />
          </div>

          {/* Risk Health */}
          <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[var(--brand)]" />
                <span className="text-sm font-medium text-[var(--ink-soft)]">
                  {t("portfolioHealth.riskHealth")}
                </span>
              </div>
              <Badge variant={getHealthColor(healthScore.risk)} className="text-xs">
                {healthScore.risk}%
              </Badge>
            </div>
            <Progress value={healthScore.risk} className="h-2" />
          </div>

          {/* Resource Health */}
          <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--brand)]" />
                <span className="text-sm font-medium text-[var(--ink-soft)]">
                  {t("portfolioHealth.resourceHealth")}
                </span>
              </div>
              <Badge variant={getHealthColor(healthScore.resource)} className="text-xs">
                {healthScore.resource}%
              </Badge>
            </div>
            <Progress value={healthScore.resource} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
