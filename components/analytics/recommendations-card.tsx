"use client";

import { useMemo } from "react";
import { AlertCircle, AlertTriangle, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/contexts/locale-context";
import type { Recommendation } from "@/lib/ai/recommendations-engine";

interface RecommendationsCardProps {
  recommendations: Recommendation[];
  isLoading?: boolean;
  maxDisplay?: number;
}

export function RecommendationsCard({
  recommendations,
  isLoading = false,
  maxDisplay = 5,
}: RecommendationsCardProps) {
  const { t } = useLocale();

  const displayRecommendations = useMemo(
    () => recommendations.slice(0, maxDisplay),
    [recommendations, maxDisplay]
  );

  const criticalCount = useMemo(
    () => recommendations.filter((r) => r.priority === "critical").length,
    [recommendations]
  );

  const warningCount = useMemo(
    () => recommendations.filter((r) => r.priority === "warning").length,
    [recommendations]
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-3 w-full bg-muted animate-pulse rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-blue-700 dark:text-blue-400">
            <Lightbulb className="h-4 w-4" />
            {t("recommendations.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-600 dark:text-blue-500">
            {t("recommendations.noRecommendations")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 dark:border-blue-900">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-blue-500" />
            {t("recommendations.title")}
          </CardTitle>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="danger" className="text-xs">
                {criticalCount} {t("recommendations.critical")}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="warning" className="text-xs">
                {warningCount} {t("recommendations.warning")}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayRecommendations.map((recommendation) => (
          <RecommendationItem key={recommendation.id} recommendation={recommendation} />
        ))}

        {recommendations.length > maxDisplay && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            disabled
          >
            {t("recommendations.viewAll")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function RecommendationItem({ recommendation }: { recommendation: Recommendation }) {
  const { t } = useLocale();
  const Icon = getRecommendationIcon(recommendation.priority);
  const colors = getPriorityColors(recommendation.priority);

  return (
    <div
      className={`rounded-lg border p-3 ${colors.bg} ${colors.border}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${colors.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium truncate">{recommendation.title}</h4>
            <Badge
              variant="neutral"
              className={`text-xs ${colors.badge}`}
            >
              {t(`recommendations.types.${recommendation.type}`)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {recommendation.description}
          </p>
          {recommendation.projectName && (
            <p className="text-xs text-muted-foreground mb-1">
              📁 {recommendation.projectName}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-medium text-foreground">
              💡 {recommendation.action}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              disabled
            >
              {t("recommendations.action")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getRecommendationIcon(priority: Recommendation["priority"]) {
  switch (priority) {
    case "critical":
      return AlertCircle;
    case "warning":
      return AlertTriangle;
    case "info":
    default:
      return Lightbulb;
  }
}

function getPriorityColors(priority: Recommendation["priority"]) {
  switch (priority) {
    case "critical":
      return {
        bg: "bg-red-50 dark:bg-red-950/50",
        border: "border-red-200 dark:border-red-900",
        icon: "text-red-600 dark:text-red-400",
        badge: "border-red-300 text-red-700 dark:border-red-700 dark:text-red-400",
      };
    case "warning":
      return {
        bg: "bg-yellow-50 dark:bg-yellow-950/50",
        border: "border-yellow-200 dark:border-yellow-900",
        icon: "text-yellow-600 dark:text-yellow-400",
        badge: "border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-400",
      };
    case "info":
    default:
      return {
        bg: "bg-blue-50 dark:bg-blue-950/50",
        border: "border-blue-200 dark:border-blue-900",
        icon: "text-blue-600 dark:text-blue-400",
        badge: "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400",
      };
  }
}
