"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, ShieldAlert, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Project, Risk } from "@/lib/types";

// Вынесено за компонент для оптимизации
const STATUS_LABELS: Record<string, string> = {
  active: "Активен",
  planning: "Планирование",
  "on-hold": "Приостановлен",
  completed: "Завершён",
  "at-risk": "В зоне риска",
};

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

// Шкала 1-5 → проценты (1=20%, 5=100%)
function riskToPercent(value: number): number {
  return Math.round((value / 5) * 100);
}

interface Alert {
  id: string;
  projectId: string;
  projectName: string;
  type: "at-risk" | "budget-deviation" | "critical-risk";
  title: string;
  description: string;
  severity: "warning" | "critical";
}

interface AlertsBlockProps {
  projects: Project[];
  risks: Risk[];
}

export function AlertsBlock({ projects, risks }: AlertsBlockProps) {
  const alerts = useMemo<Alert[]>(() => {
    const result: Alert[] = [];

    // At-risk projects
    projects.forEach((project) => {
      if (project.status === "at-risk") {
        result.push({
          id: `status-${project.id}`,
          projectId: project.id,
          projectName: project.name,
          type: "at-risk",
          title: `${project.name} — требует внимания`,
          description: `Статус: ${getStatusLabel(project.status)}`,
          severity: "critical",
        });
      }

      // Budget deviation >10%
      if (project.history.length >= 2) {
        const latest = project.history[project.history.length - 1];
        const plannedPct = (latest.budgetPlanned / project.budget.planned) * 100;
        const actualPct = (latest.budgetActual / project.budget.planned) * 100;
        const deviation = Math.abs(actualPct - plannedPct);

        if (deviation > 10) {
          result.push({
            id: `budget-${project.id}`,
            projectId: project.id,
            projectName: project.name,
            type: "budget-deviation",
            title: `${project.name} — отклонение бюджета`,
            description: `Отклонение ${deviation.toFixed(0)}% от плана`,
            severity: "warning",
          });
        }
      }
    });

    // Critical risks (probability & impact >= 3.5 из шкалы 1-5 = 70%)
    risks.forEach((risk) => {
      if (risk.probability >= 3.5 && risk.impact >= 3.5) {
        const project = projects.find((p) => p.id === risk.projectId);
        result.push({
          id: `risk-${risk.id}`,
          projectId: risk.projectId,
          projectName: project?.name ?? "Проект",
          type: "critical-risk",
          title: `${risk.title} — критический риск`,
          description: `Вероятность: ${riskToPercent(risk.probability)}%, Влияние: ${riskToPercent(risk.impact)}%`,
          severity: "critical",
        });
      }
    });

    return result;
  }, [projects, risks]);

  if (alerts.length === 0) return null;

  return (
    <Card className="p-4 mb-4 border-l-4 border-l-red-500" role="region" aria-label="Сигналы и оповещения">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
        <h3 className="font-semibold">Что требует внимания</h3>
        <Badge variant="danger">{alerts.length}</Badge>
      </div>

      <div className="space-y-2" role="list">
        {alerts.slice(0, 5).map((alert) => (
          <Link
            key={alert.id}
            href={`/projects/${alert.projectId}`}
            className="flex items-start justify-between gap-2 p-2 rounded hover:bg-muted transition-colors"
            role="listitem"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {alert.type === "at-risk" && <ShieldAlert className="h-4 w-4 text-red-500" aria-hidden="true" />}
                {alert.type === "budget-deviation" && <TrendingDown className="h-4 w-4 text-amber-500" aria-hidden="true" />}
                {alert.type === "critical-risk" && <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden="true" />}
                <span className="text-sm font-medium truncate">{alert.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{alert.description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </Card>
  );
}
