"use client";

import { useMemo } from "react";
import type {
  Project,
  Task,
  TeamMember,
  Risk,
  AutoRisk,
  Severity,
} from "@/lib/types";
import { useEVMMetrics } from "./use-evm-metrics";

/**
 * Monitoring Agent: Auto-detect risks based on project data
 *
 * Risk detection rules:
 * - Schedule risk: SPI < 0.9 or overdue milestones
 * - Budget risk: CPI < 0.9 or budget variance > 10%
 * - Resource risk: overloaded team members (>90% capacity)
 * - Scope risk: too many open tasks, low progress
 */
export function useAutoRisks(
  project: Project | null,
  tasks: Task[],
  team: TeamMember[],
  existingRisks: Risk[]
): AutoRisk[] {
  const evmMetrics = useEVMMetrics(project);

  return useMemo(() => {
    if (!project || !evmMetrics) return [];

    const risks: AutoRisk[] = [];
    const now = new Date();

    // 1. Schedule risks (SPI-based)
    if (evmMetrics.spi < 0.9) {
      const severity: Severity = evmMetrics.spi < 0.7 ? "critical" : "warning";
      risks.push({
        id: `auto-schedule-${project.id}`,
        projectId: project.id,
        type: "schedule",
        severity,
        title:
          severity === "critical"
            ? "Критическое отставание от графика"
            : "Отставание от графика",
        description: `SPI = ${evmMetrics.spi.toFixed(
          2
        )}. Проект выполняется медленнее плана на ${Math.round(
          (1 - evmMetrics.spi) * 100
        )}%.`,
        detectedAt: now.toISOString(),
        probability: evmMetrics.spi < 0.7 ? 90 : 70,
        impact: evmMetrics.spi < 0.7 ? 90 : 60,
        recommendation:
          "Проверить критический путь, увеличить ресурсы или пересмотреть сроки.",
      });
    }

    // 2. Check for overdue milestones
    const projectEndDate = new Date(project.dates.end);
    if (projectEndDate < now && project.progress < 100) {
      risks.push({
        id: `auto-overdue-${project.id}`,
        projectId: project.id,
        type: "schedule",
        severity: "critical",
        title: "Просрочен дедлайн проекта",
        description: `Дата завершения ${formatDate(
          project.dates.end
        )} прошла, прогресс ${project.progress}%.`,
        detectedAt: now.toISOString(),
        probability: 100,
        impact: 90,
        recommendation:
          "Немедленно пересмотреть план и уведомить стейкхолдеров.",
      });
    }

    // 3. Budget risks (CPI-based)
    if (evmMetrics.cpi < 0.9) {
      const severity: Severity = evmMetrics.cpi < 0.7 ? "critical" : "warning";
      const budgetVariance = ((evmMetrics.eac - project.budget.planned) / project.budget.planned) * 100;
      risks.push({
        id: `auto-budget-${project.id}`,
        projectId: project.id,
        type: "budget",
        severity,
        title:
          severity === "critical"
            ? "Критическое превышение бюджета"
            : "Риск превышения бюджета",
        description: `CPI = ${evmMetrics.cpi.toFixed(
          2
        )}. Прогнозируемое превышение: ${Math.abs(budgetVariance).toFixed(1)}% (${formatCurrency(
          Math.abs(evmMetrics.vac)
        )}).`,
        detectedAt: now.toISOString(),
        probability: evmMetrics.cpi < 0.7 ? 90 : 70,
        impact: evmMetrics.cpi < 0.7 ? 90 : 60,
        recommendation:
          "Проанализировать затраты, найти способы экономии или запросить дополнительный бюджет.",
      });
    }

    // 4. Resource risks (overloaded team)
    const overloadedMembers = team.filter(
      (member) => member.allocated / member.capacity > 0.9
    );
    if (overloadedMembers.length > 0) {
      risks.push({
        id: `auto-resource-${project.id}`,
        projectId: project.id,
        type: "resource",
        severity: "warning",
        title: "Перегрузка команды",
        description: `${overloadedMembers.length} из ${team.length} участников загружены более 90%.`,
        detectedAt: now.toISOString(),
        probability: 80,
        impact: 50,
        recommendation:
          "Перераспределить задачи или привлечь дополнительных исполнителей.",
      });
    }

    // 5. Resource risks (understaffed)
    if (team.length < 2 && project.progress < 100) {
      risks.push({
        id: `auto-understaffed-${project.id}`,
        projectId: project.id,
        type: "resource",
        severity: "warning",
        title: "Недостаточно ресурсов",
        description: `В команде только ${team.length} человек для проекта "${project.name}".`,
        detectedAt: now.toISOString(),
        probability: 60,
        impact: 70,
        recommendation: "Рассмотреть возможность расширения команды.",
      });
    }

    // 6. Scope risks (too many open tasks)
    const openTasks = tasks.filter(
      (t) => t.status === "todo" || t.status === "in-progress"
    );
    const completedTasks = tasks.filter((t) => t.status === "done");
    if (openTasks.length > 10 && completedTasks.length / tasks.length < 0.3) {
      risks.push({
        id: `auto-scope-${project.id}`,
        projectId: project.id,
        type: "scope",
        severity: "warning",
        title: "Накопление невыполненных задач",
        description: `${openTasks.length} открытых задач, завершено только ${Math.round(
          (completedTasks.length / tasks.length) * 100
        )}%.`,
        detectedAt: now.toISOString(),
        probability: 70,
        impact: 60,
        recommendation:
          "Приоритизировать задачи, возможно сократить scope проекта.",
      });
    }

    // 7. Scope risks (blocked tasks)
    const blockedTasks = tasks.filter((t) => t.status === "blocked");
    if (blockedTasks.length > 2) {
      risks.push({
        id: `auto-blocked-${project.id}`,
        projectId: project.id,
        type: "scope",
        severity: blockedTasks.length > 5 ? "critical" : "warning",
        title: "Много заблокированных задач",
        description: `${blockedTasks.length} задач заблокировано и требует внимания.`,
        detectedAt: now.toISOString(),
        probability: 80,
        impact: blockedTasks.length > 5 ? 80 : 50,
        recommendation:
          "Провести ревью заблокированных задач, устранить препятствия.",
      });
    }

    // 8. High existing risks
    const highRisks = existingRisks.filter(
      (r) => r.status === "open" && r.probability >= 4 && r.impact >= 4
    );
    if (highRisks.length > 2) {
      risks.push({
        id: `auto-highrisks-${project.id}`,
        projectId: project.id,
        type: "scope",
        severity: "critical",
        title: "Высокие риски без митигации",
        description: `${highRisks.length} рисков с высокой вероятностью и_impактом.`,
        detectedAt: now.toISOString(),
        probability: 70,
        impact: 90,
        recommendation:
          "Немедленно разработать планы митигации для критических рисков.",
      });
    }

    return risks;
  }, [project, tasks, team, existingRisks, evmMetrics]);
}

/**
 * Calculate portfolio-level auto risks
 * Note: allTasks, allTeam, allRisks reserved for future use
 */
export function usePortfolioAutoRisks(
  projects: Project[],
  _allTasks: Task[],
  _allTeam: TeamMember[],
  _allRisks: Risk[]
): AutoRisk[] {
  return useMemo(() => {
    const risks: AutoRisk[] = [];
    const now = new Date();

    // Portfolio-level risks
    const atRiskProjects = projects.filter((p) => p.status === "at-risk");
    if (atRiskProjects.length > projects.length * 0.3) {
      risks.push({
        id: "portfolio-at-risk",
        projectId: "portfolio",
        type: "scope",
        severity: "critical",
        title: "Критическое состояние портфеля",
        description: `${atRiskProjects.length} из ${projects.length} проектов в статусе "в риске".`,
        detectedAt: now.toISOString(),
        probability: 90,
        impact: 90,
        recommendation:
          "Провести экстренный обзор портфеля, приоритизировать проекты.",
      });
    }

    // Budget variance across portfolio
    const totalPlanned = projects.reduce(
      (sum, p) => sum + p.budget.planned,
      0
    );
    const totalActual = projects.reduce((sum, p) => sum + p.budget.actual, 0);
    const budgetVariance =
      totalPlanned > 0
        ? ((totalActual - totalPlanned) / totalPlanned) * 100
        : 0;

    if (budgetVariance > 15) {
      risks.push({
        id: "portfolio-budget",
        projectId: "portfolio",
        type: "budget",
        severity: "critical",
        title: "Превышение бюджета портфеля",
        description: `Общее превышение: ${budgetVariance.toFixed(
          1
        )}% (${formatCurrency(totalActual - totalPlanned)}).`,
        detectedAt: now.toISOString(),
        probability: 95,
        impact: 90,
        recommendation:
          "Пересмотреть бюджеты проектов, приостановить низкоприоритетные.",
      });
    }

    return risks;
  }, [projects]);
}

// Helper functions

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
