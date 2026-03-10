"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  teamSize: number;
  averageHealth: number;
}

interface ProjectHealth {
  projectId: string;
  projectName: string;
  healthScore: number;
  status: "healthy" | "at_risk" | "critical";
  progress: number;
  overdueTasks: number;
}

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  completedTasks: number;
  totalTasks: number;
  performance: number;
}

const statusColors = {
  healthy: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  at_risk: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const statusLabels = {
  healthy: "Здоров",
  at_risk: "Под угрозой",
  critical: "Критичен",
};

export const AnalyticsDashboard = React.memo(function AnalyticsDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [projects, setProjects] = useState<ProjectHealth[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "team">("overview");

  const fetchData = useCallback(async () => {
    try {
      const [overviewRes, teamRes] = await Promise.all([
        fetch("/api/analytics/overview"),
        fetch("/api/analytics/team-performance"),
      ]);

      const overviewData = await overviewRes.json();
      const teamData = await teamRes.json();

      setSummary(overviewData.summary);
      setProjects(overviewData.projects || []);
      setTeam(teamData.members || []);
    } catch (error) {
      console.error("[AnalyticsDashboard] Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => a.healthScore - b.healthScore);
  }, [projects]);

  const topPerformers = useMemo(() => {
    return [...team]
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 5);
  }, [team]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="h-20 animate-pulse rounded bg-[var(--surface-secondary)]" />
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <div className="h-64 animate-pulse rounded bg-[var(--surface-secondary)]" />
        </Card>
      </div>
    );
  }

  if (!summary) {
    return (
      <Card className="p-6">
        <p className="text-center text-[var(--ink-muted)]">
          Не удалось загрузить аналитику
        </p>
      </Card>
    );
  }

  const completionRate = summary.totalTasks > 0
    ? Math.round((summary.completedTasks / summary.totalTasks) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Аналитика</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          className="transition-all duration-200 hover:scale-105"
        >
          <Activity className="mr-2 h-4 w-4" />
          Обновить
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group p-6 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
              <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--ink-muted)]">Проекты</p>
              <p className="text-2xl font-bold">
                {summary.activeProjects}/{summary.totalProjects}
              </p>
            </div>
          </div>
        </Card>

        <Card className="group p-6 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--ink-muted)]">Задачи</p>
              <p className="text-2xl font-bold">{completionRate}%</p>
            </div>
          </div>
        </Card>

        <Card className="group p-6 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--ink-muted)]">Просрочено</p>
              <p className="text-2xl font-bold">{summary.overdueTasks}</p>
            </div>
          </div>
        </Card>

        <Card className="group p-6 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--ink-muted)]">Команда</p>
              <p className="text-2xl font-bold">{summary.teamSize}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--line)]">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-all duration-200",
            activeTab === "overview"
              ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
              : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
          )}
        >
          Обзор проектов
        </button>
        <button
          onClick={() => setActiveTab("team")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-all duration-200",
            activeTab === "team"
              ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
              : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
          )}
        >
          Команда
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Здоровье проектов</h3>
          <div className="space-y-4">
            {sortedProjects.length === 0 ? (
              <p className="text-center text-[var(--ink-muted)] py-8">
                Нет активных проектов
              </p>
            ) : (
              sortedProjects.map((project) => (
                <div
                  key={project.projectId}
                  className="flex items-center justify-between rounded-lg border border-[var(--line)] p-4 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{project.projectName}</h4>
                      <Badge className={statusColors[project.status]}>
                        {statusLabels[project.status]}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-[var(--ink-muted)]">
                      <span>Прогресс: {project.progress}%</span>
                      {project.overdueTasks > 0 && (
                        <span className="text-red-500">
                          Просрочено: {project.overdueTasks}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {project.healthScore}
                    </div>
                    <div className="text-xs text-[var(--ink-muted)]">Health</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeTab === "team" && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Топ исполнители</h3>
          <div className="space-y-4">
            {topPerformers.length === 0 ? (
              <p className="text-center text-[var(--ink-muted)] py-8">
                Нет данных по команде
              </p>
            ) : (
              topPerformers.map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 rounded-lg border border-[var(--line)] p-4 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{member.name}</h4>
                    <div className="text-sm text-[var(--ink-muted)]">
                      {member.completedTasks}/{member.totalTasks} задач
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.performance >= 70 ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-lg font-bold">{member.performance}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
});
