"use client";

import { useMemo } from "react";
import { calculatePortfolioHealth, type HealthScore } from "@/lib/ai/health-calculator";
import { useDashboardSnapshot } from "./use-api";

/**
 * Hook for portfolio health calculations
 *
 * Uses dashboard snapshot data to calculate portfolio-level health metrics
 * including budget, schedule, risk, and resource health.
 */
export function usePortfolioHealth(): HealthScore | null {
  const { projects, risks, team } = useDashboardSnapshot();

  return useMemo(() => {
    if (projects.length === 0) {
      return null;
    }

    // Calculate average team utilization
    const avgUtilization =
      team.length > 0
        ? team.reduce((sum, member) => sum + member.allocated, 0) / team.length
        : 0;

    // Calculate portfolio health
    return calculatePortfolioHealth(projects, risks, avgUtilization);
  }, [projects, risks, team]);
}
