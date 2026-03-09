"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TeamMember } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TeamMemberCardProps {
  member: TeamMember;
}

function getCapacityColor(allocated: number): string {
  if (allocated >= 90) return "bg-red-500";
  if (allocated >= 70) return "bg-amber-500";
  return "bg-green-500";
}

function getCapacityTextColor(allocated: number): string {
  if (allocated >= 90) return "text-red-600";
  if (allocated >= 70) return "text-amber-600";
  return "text-green-600";
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  const capacityColor = getCapacityColor(member.allocated);
  const capacityTextColor = getCapacityTextColor(member.allocated);

  return (
    <Card className="bg-[color:var(--surface-panel)] overflow-hidden">
      <CardContent className="space-y-4 p-4">
        {/* Header with avatar and name */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-semibold text-white">
              {member.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-lg font-semibold tracking-[-0.04em] text-[var(--ink)] truncate">
                {member.name}
              </p>
              <p className="text-sm text-[var(--ink-soft)] truncate">{member.role}</p>
            </div>
          </div>
          <Badge
            variant={
              member.allocated >= 90
                ? "danger"
                : member.allocated >= 70
                  ? "warning"
                  : "success"
            }
          >
            {member.allocated}%
          </Badge>
        </div>

        {/* Capacity bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--ink-muted)]">Capacity</span>
            <span className={cn("font-semibold", capacityTextColor)}>
              {member.allocated}% / {member.capacity}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--panel-soft-strong)] overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-300", capacityColor)}
              style={{ width: `${Math.min(member.allocated, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[8px] bg-[var(--panel-soft)] p-3 text-center">
            <div className="text-lg font-semibold text-[var(--ink)]">
              {member.projects.length}
            </div>
            <div className="text-xs text-[var(--ink-muted)]">Projects</div>
          </div>
          <div className="rounded-[8px] bg-[var(--panel-soft)] p-3 text-center">
            <div className={cn("text-lg font-semibold", capacityTextColor)}>
              {member.allocated >= 90 ? "Critical" : member.allocated >= 70 ? "High" : "Normal"}
            </div>
            <div className="text-xs text-[var(--ink-muted)]">Workload</div>
          </div>
        </div>

        {/* Project assignments */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Assignments
          </p>
          <div className="flex flex-wrap gap-1.5">
            {member.projects.map((project) => (
              <Badge key={project} variant="neutral" className="text-xs">
                {project}
              </Badge>
            ))}
          </div>
        </div>

        {/* Contact info */}
        <div className="text-sm text-[var(--ink-soft)] space-y-0.5">
          <div className="truncate">{member.location}</div>
          <div className="truncate">{member.email}</div>
        </div>
      </CardContent>
    </Card>
  );
}
