"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataErrorState } from "@/components/ui/data-error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamMemberCard } from "@/components/team/team-member-card";
import { useLocale } from "@/contexts/locale-context";
import { useTeam } from "@/lib/hooks/use-api";

function TeamSkeleton() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-40" />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Card key={index} className="bg-[var(--panel-soft)]/60">
              <CardContent className="space-y-4 p-6">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-36" />
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function TeamPage() {
  const { t } = useLocale();
  const { error, isLoading, mutate, team } = useTeam();

  if (isLoading && team.length === 0) {
    return <TeamSkeleton />;
  }

  if (error && team.length === 0) {
    return (
      <DataErrorState
        actionLabel={t("action.retry")}
        description={t("error.loadDescription")}
        onRetry={() => {
          void mutate();
        }}
        title={t("error.loadTitle")}
      />
    );
  }

  // Calculate team stats
  const criticalCount = team.filter(m => m.allocated >= 90).length;
  const highLoadCount = team.filter(m => m.allocated >= 70 && m.allocated < 90).length;
  const normalCount = team.filter(m => m.allocated < 70).length;

  return (
    <div className="grid gap-6">
      {/* Team Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/14 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <div>
                <p className="text-2xl font-heading font-semibold text-green-600">{normalCount}</p>
                <p className="text-xs text-[var(--ink-muted)]">Normal Load</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/14 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-heading font-semibold text-amber-600">{highLoadCount}</p>
                <p className="text-xs text-[var(--ink-muted)]">High Load</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-500/14 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-red-500" />
              </div>
              <div>
                <p className="text-2xl font-heading font-semibold text-red-600">{criticalCount}</p>
                <p className="text-xs text-[var(--ink-muted)]">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Grid */}
      <Card>
        <CardHeader>
          <CardTitle>{t("team.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {team.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
