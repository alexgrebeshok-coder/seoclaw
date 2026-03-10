"use client";

import { useMemo } from "react";
import { AlertCircle, AlertTriangle, Info, BrainCircuit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AIInsight } from "@/lib/ai/insights-generator";
import { useLocale } from "@/contexts/locale-context";

interface AIInsightsCardProps {
  insights: AIInsight[];
  maxDisplay?: number;
  onViewAll?: () => void;
}

export function AIInsightsCard({
  insights,
  maxDisplay = 5,
  onViewAll,
}: AIInsightsCardProps) {
  const { t } = useLocale();

  const displayInsights = useMemo(
    () => insights.slice(0, maxDisplay),
    [insights, maxDisplay]
  );

  const criticalCount = useMemo(
    () => insights.filter((i) => i.severity === "critical").length,
    [insights]
  );

  const warningCount = useMemo(
    () => insights.filter((i) => i.severity === "warning").length,
    [insights]
  );

  const infoCount = useMemo(
    () => insights.filter((i) => i.severity === "info").length,
    [insights]
  );

  if (insights.length === 0) {
    return (
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-blue-700 dark:text-blue-400">
            <BrainCircuit className="h-4 w-4" />
            {t("aiInsights.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-600 dark:text-blue-500">
            {t("aiInsights.noInsights")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 dark:border-purple-900">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BrainCircuit className="h-4 w-4 text-purple-500" />
            {t("aiInsights.title")}
          </CardTitle>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="danger" className="text-xs">
                {criticalCount} {t("aiInsights.critical")}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="warning" className="text-xs">
                {warningCount} {t("aiInsights.warning")}
              </Badge>
            )}
            {infoCount > 0 && (
              <Badge variant="neutral" className="text-xs text-blue-600 border-blue-300">
                {infoCount} {t("aiInsights.info")}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayInsights.map((insight) => (
          <InsightItem key={insight.id} insight={insight} />
        ))}

        {insights.length > maxDisplay && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={onViewAll}
            disabled
          >
            {t("aiInsights.viewAll")} ({insights.length - maxDisplay} more)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function InsightItem({ insight }: { insight: AIInsight }) {
  const { t } = useLocale();
  const Icon = getInsightIcon(insight.severity);
  const TypeIcon = getInsightTypeIcon(insight.type);
  const severityColors = getSeverityColors(insight.severity);

  return (
    <div
      className={`rounded-lg border p-3 ${severityColors.bg} ${severityColors.border}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${severityColors.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <h4 className="text-sm font-medium truncate">{insight.title}</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
            {insight.description}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge
              variant="neutral"
              className={`text-xs ${severityColors.badge}`}
            >
              {t(`aiInsights.${insight.type}`)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function getInsightIcon(severity: AIInsight["severity"]) {
  switch (severity) {
    case "critical":
      return AlertCircle;
    case "warning":
      return AlertTriangle;
    case "info":
      return Info;
    default:
      return Info;
  }
}

function getInsightTypeIcon(type: AIInsight["type"]) {
  switch (type) {
    case "trend":
      return AlertCircle; // Using AlertCircle as fallback for now
    case "anomaly":
      return AlertTriangle;
    case "pattern":
      return Info;
    case "warning":
      return AlertCircle;
    default:
      return Info;
  }
}

function getSeverityColors(severity: AIInsight["severity"]) {
  switch (severity) {
    case "critical":
      return {
        bg: "bg-red-50 dark:bg-red-950/50",
        border: "border-red-200 dark:border-red-900",
        icon: "text-red-600 dark:text-red-400",
        badge:
          "border-red-300 text-red-700 dark:border-red-700 dark:text-red-400",
      };
    case "warning":
      return {
        bg: "bg-orange-50 dark:bg-orange-950/50",
        border: "border-orange-200 dark:border-orange-900",
        icon: "text-orange-600 dark:text-orange-400",
        badge:
          "border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-400",
      };
    case "info":
    default:
      return {
        bg: "bg-blue-50 dark:bg-blue-950/50",
        border: "border-blue-200 dark:border-blue-900",
        icon: "text-blue-600 dark:text-blue-400",
        badge:
          "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400",
      };
  }
}
