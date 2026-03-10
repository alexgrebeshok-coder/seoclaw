"use client";

import { useMemo, useState, useCallback } from "react";
import { useDashboardSnapshot } from "./use-api";
import { generateInsights, type AIInsight } from "@/lib/ai/insights-generator";

/**
 * AI Insights Hook
 * Generates and caches AI-powered insights for the portfolio
 * Note: Uses raw project data for insights generation (not EVM hooks)
 */
export function useAIInsights(
  cacheDuration: number = 5 * 60 * 1000 // 5 minutes default
) {
  const { projects, tasks, team, risks } = useDashboardSnapshot();
  const [cachedInsights, setCachedInsights] = useState<{
    insights: AIInsight[];
    timestamp: number;
  } | null>(null);

  // Check if cache is still valid
  const isCacheValid = useMemo(() => {
    if (!cachedInsights) return false;
    const now = Date.now();
    return now - cachedInsights.timestamp < cacheDuration;
  }, [cachedInsights, cacheDuration]);

  // Generate insights (use cache if valid)
  const insights = useMemo(() => {
    if (isCacheValid && cachedInsights) {
      return cachedInsights.insights;
    }

    // Generate insights from raw project data
    // Note: We pass empty maps for EVM and risks since we're not computing them here
    // The insights generator will fall back to basic metrics from project data
    const newInsights = generateInsights(
      projects,
      new Map(), // EVM metrics not computed here to avoid calling hooks in loops
      new Map()  // Auto-risks not computed here to avoid calling hooks in loops
    );

    // Update cache
    setCachedInsights({
      insights: newInsights,
      timestamp: Date.now(),
    });

    return newInsights;
  }, [projects, isCacheValid, cachedInsights, cacheDuration]);

  // Manual cache invalidation
  const invalidateCache = useCallback(() => {
    setCachedInsights(null);
  }, []);

  return {
    insights,
    isLoading: false,
    error: null,
    invalidateCache,
  };
}
