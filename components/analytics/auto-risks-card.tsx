"use client";

import { useMemo } from "react";
import { AlertTriangle, Clock, DollarSign, Users, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AutoRisk, Severity } from "@/lib/types";
import { useLocale } from "@/contexts/locale-context";

interface AutoRisksCardProps {
  risks: AutoRisk[];
  maxDisplay?: number;
  onViewAll?: () => void;
}

export function AutoRisksCard({
  risks,
  maxDisplay = 5,
  onViewAll,
}: AutoRisksCardProps) {
  const { t } = useLocale();

  const displayRisks = useMemo(
    () => risks.slice(0, maxDisplay),
    [risks, maxDisplay]
  );

  const criticalCount = useMemo(
    () => risks.filter((r) => r.severity === "critical").length,
    [risks]
  );

  const warningCount = useMemo(
    () => risks.filter((r) => r.severity === "warning").length,
    [risks]
  );

  if (risks.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-green-700 dark:text-green-400">
            <AlertTriangle className="h-4 w-4" />
            {t("autoRisks.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600 dark:text-green-500">
            {t("autoRisks.noRisks")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 dark:border-orange-900">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            {t("autoRisks.title")}
          </CardTitle>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="danger" className="text-xs">
                {criticalCount} {t("autoRisks.critical")}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge
                variant="warning"
                className="text-xs"
              >
                {warningCount} {t("autoRisks.warnings")}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayRisks.map((risk) => (
          <RiskItem key={risk.id} risk={risk} />
        ))}

        {risks.length > maxDisplay && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={onViewAll}
          >
            {t("autoRisks.viewAll")} ({risks.length - maxDisplay} {t("autoRisks.more")})
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function RiskItem({ risk }: { risk: AutoRisk }) {
  const { t } = useLocale();
  const Icon = getRiskIcon(risk.type);
  const severityColors = getSeverityColors(risk.severity);

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
            <h4 className="text-sm font-medium truncate">{risk.title}</h4>
            <Badge
              variant="neutral"
              className={`text-xs ${severityColors.badge}`}
            >
              {t(`autoRisks.types.${risk.type}`)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {risk.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              {t("autoRisks.probability")}: {risk.probability}%
            </span>
            <span>
              {t("autoRisks.impact")}: {risk.impact}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 italic">
            💡 {risk.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}

function getRiskIcon(type: AutoRisk["type"]) {
  switch (type) {
    case "schedule":
      return Clock;
    case "budget":
      return DollarSign;
    case "resource":
      return Users;
    case "scope":
      return Briefcase;
    default:
      return AlertTriangle;
  }
}

function getSeverityColors(severity: Severity) {
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
