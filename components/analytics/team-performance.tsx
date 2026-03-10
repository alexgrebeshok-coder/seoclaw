"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TeamPerformanceProps {
  projectId?: string;
}

export const TeamPerformance = React.memo(function TeamPerformance({
  projectId,
}: TeamPerformanceProps) {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchPerformance() {
      try {
        const url = projectId
          ? `/api/analytics/team-performance?projectId=${projectId}`
          : "/api/analytics/team-performance";
        const response = await fetch(url);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("[TeamPerformance] Error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPerformance();
  }, [projectId]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-48 animate-pulse rounded bg-[var(--surface-secondary)]" />
      </Card>
    );
  }

  if (!data || data.members.length === 0) {
    return (
      <Card className="p-6 text-center text-[var(--ink-muted)]">
        No team data available
      </Card>
    );
  }

  const { summary, members } = data;

  // Prepare chart data
  const chartData = members.map((m: any) => ({
    name: m.memberInitials || m.memberName?.split(" ")[0],
    score: m.performanceScore,
    tasks: m.metrics.totalTasks,
    completed: m.metrics.completedTasks,
  }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-[var(--ink-muted)]">Team Members</div>
          <div className="mt-1 text-2xl font-bold">{summary.totalMembers}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-[var(--ink-muted)]">Total Tasks</div>
          <div className="mt-1 text-2xl font-bold">{summary.totalTasks}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-[var(--ink-muted)]">Completed</div>
          <div className="mt-1 text-2xl font-bold">{summary.totalCompleted}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-[var(--ink-muted)]">Avg Score</div>
          <div className="mt-1 text-2xl font-bold">{summary.avgPerformanceScore}</div>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Performance Scores</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="score" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Member List */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Team Members</h3>
        <div className="space-y-3">
          {members.map((member: any) => (
            <div
              key={member.memberId}
              className="flex items-center justify-between rounded-lg border border-[var(--line)] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-medium text-white">
                  {member.memberInitials}
                </div>
                <div>
                  <div className="font-medium">{member.memberName}</div>
                  <div className="text-sm text-[var(--ink-muted)]">
                    {member.role || "Team Member"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-[var(--ink-muted)]">
                    {member.metrics.completedTasks}/{member.metrics.totalTasks} tasks
                  </div>
                  <div className="text-xs text-[var(--ink-muted)]">
                    {member.time.totalHoursLogged}h logged
                  </div>
                </div>
                <Badge
                  variant={
                    member.performanceScore >= 70
                      ? "success"
                      : member.performanceScore >= 40
                      ? "warning"
                      : "danger"
                  }
                >
                  {member.performanceScore}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
});
