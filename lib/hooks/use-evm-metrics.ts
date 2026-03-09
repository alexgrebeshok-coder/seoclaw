"use client";

import { useMemo } from "react";
import type { Project, EVMMetrics, BudgetForecast, ProjectHealth } from "@/lib/types";

/**
 * Calculate EVM metrics for a project
 *
 * EVM (Earned Value Management) formulas:
 * - EV (Earned Value) = Budget × Progress%
 * - PV (Planned Value) = Budget × (Elapsed Time / Total Duration)
 * - AC (Actual Cost) = Actual spend to date
 * - CPI (Cost Performance Index) = EV / AC
 * - SPI (Schedule Performance Index) = EV / PV
 * - EAC (Estimate at Completion) = BAC / CPI
 * - VAC (Variance at Completion) = BAC - EAC
 */
export function useEVMMetrics(project: Project | null): EVMMetrics | null {
  return useMemo(() => {
    if (!project) return null;

    const { budget, progress, dates } = project;
    const plannedBudget = budget.planned;
    const actualCost = budget.actual;

    // Earned Value: запланированный бюджет × прогресс
    const ev = plannedBudget * (progress / 100);

    // Planned Value: запланированный бюджет × (прошедшее время / общая длительность)
    const startDate = new Date(dates.start);
    const endDate = new Date(dates.end);
    const now = new Date();

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const scheduleProgress = Math.max(0, Math.min(1, elapsed / totalDuration));
    const pv = plannedBudget * scheduleProgress;

    // Actual Cost: фактические затраты
    const ac = actualCost;

    // CPI (Cost Performance Index): EV / AC
    // > 1 = under budget, < 1 = over budget
    const cpi = ac > 0 ? ev / ac : ev > 0 ? 1 : 0;

    // SPI (Schedule Performance Index): EV / PV
    // > 1 = ahead of schedule, < 1 = behind schedule
    const spi = pv > 0 ? ev / pv : ev > 0 ? 1 : 0;

    // EAC (Estimate at Completion): BAC / CPI
    const eac = cpi > 0 ? plannedBudget / cpi : plannedBudget;

    // VAC (Variance at Completion): BAC - EAC
    const vac = plannedBudget - eac;

    // Percent complete (EVM-based)
    const percentComplete = progress;

    return {
      ev: Math.round(ev),
      pv: Math.round(pv),
      ac: Math.round(ac),
      cpi: Math.round(cpi * 100) / 100,
      spi: Math.round(spi * 100) / 100,
      eac: Math.round(eac),
      vac: Math.round(vac),
      percentComplete,
    };
  }, [project]);
}

/**
 * Calculate budget forecast for project completion
 */
export function useBudgetForecast(project: Project | null): BudgetForecast | null {
  const evmMetrics = useEVMMetrics(project);

  return useMemo(() => {
    if (!project || !evmMetrics) return null;

    const { eac, vac } = evmMetrics;
    const originalBudget = project.budget.planned;

    const variance = vac;
    const variancePercent = originalBudget > 0 ? (vac / originalBudget) * 100 : 0;

    // Confidence based on project progress (more progress = higher confidence)
    const confidence = Math.min(95, 50 + project.progress * 0.45);

    return {
      estimatedTotal: eac,
      originalBudget,
      variance,
      variancePercent: Math.round(variancePercent * 10) / 10,
      forecastDate: new Date().toISOString(),
      confidence: Math.round(confidence),
    };
  }, [project, evmMetrics]);
}

/**
 * Calculate project health score (0-100)
 *
 * Health = weighted average of:
 * - Budget health (40% weight)
 * - Schedule health (30% weight)
 * - Risk health (30% weight)
 */
export function useProjectHealth(
  project: Project | null,
  risks: { probability: number; impact: number; status: string }[]
): ProjectHealth | null {
  const evmMetrics = useEVMMetrics(project);

  return useMemo(() => {
    if (!project || !evmMetrics) return null;

    // Budget health: based on CPI
    // CPI >= 1.1 → 100, CPI <= 0.9 → 0, linear between
    const budgetHealth = calculateBudgetHealth(evmMetrics.cpi);

    // Schedule health: based on SPI
    // SPI >= 1.1 → 100, SPI <= 0.9 → 0, linear between
    const scheduleHealth = calculateScheduleHealth(evmMetrics.spi);

    // Risk health: based on open risks
    const riskHealth = calculateRiskHealth(risks);

    // Overall health: weighted average
    const overall = Math.round(
      budgetHealth * 0.4 + scheduleHealth * 0.3 + riskHealth * 0.3
    );

    // Trend: compare with previous (simplified - just based on current state)
    const trend = determineTrend(overall, budgetHealth, scheduleHealth, riskHealth);

    return {
      overall,
      budget: Math.round(budgetHealth),
      schedule: Math.round(scheduleHealth),
      risks: Math.round(riskHealth),
      trend,
      calculatedAt: new Date().toISOString(),
    };
  }, [project, evmMetrics, risks]);
}

// Helper functions

function calculateBudgetHealth(cpi: number): number {
  // CPI >= 1.1 → excellent (100)
  // CPI = 1.0 → on budget (70)
  // CPI <= 0.9 → over budget (0-40)
  if (cpi >= 1.1) return 100;
  if (cpi >= 1.0) return 70 + (cpi - 1.0) * 300; // 70-100
  if (cpi >= 0.9) return 40 + (cpi - 0.9) * 300; // 40-70
  return Math.max(0, cpi * 44.44); // 0-40
}

function calculateScheduleHealth(spi: number): number {
  // SPI >= 1.1 → ahead of schedule (100)
  // SPI = 1.0 → on schedule (70)
  // SPI <= 0.9 → behind schedule (0-40)
  if (spi >= 1.1) return 100;
  if (spi >= 1.0) return 70 + (spi - 1.0) * 300; // 70-100
  if (spi >= 0.9) return 40 + (spi - 0.9) * 300; // 40-70
  return Math.max(0, spi * 44.44); // 0-40
}

function calculateRiskHealth(
  risks: { probability: number; impact: number; status: string }[]
): number {
  if (risks.length === 0) return 100;

  // Filter open risks
  const openRisks = risks.filter((r) => r.status === "open");
  if (openRisks.length === 0) return 95;

  // Calculate risk score (probability × impact)
  // Assuming probability and impact are 1-5 scale
  const totalRiskScore = openRisks.reduce((sum, r) => {
    const score = (r.probability / 5) * (r.impact / 5);
    return sum + score;
  }, 0);

  const avgRiskScore = totalRiskScore / openRisks.length;

  // Convert to health score (higher risk = lower health)
  // avgRiskScore 0-1 → health 100-0
  const health = 100 - avgRiskScore * 100;

  return Math.max(0, Math.min(100, health));
}

function determineTrend(
  overall: number,
  budgetHealth: number,
  scheduleHealth: number,
  riskHealth: number
): "improving" | "stable" | "declining" {
  // Simplified trend detection
  // In real implementation, would compare with historical data
  const avgHealth = (budgetHealth + scheduleHealth + riskHealth) / 3;

  if (avgHealth >= 75) return "improving";
  if (avgHealth >= 50) return "stable";
  return "declining";
}
