"use client";

import { memo } from "react";
import Link from "next/link";
import { Copy, Edit3, Flag, MoveRight } from "lucide-react";

import { useLocale } from "@/contexts/locale-context";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/lib/types";
import {
  cn,
  formatCurrency,
  initials,
  priorityMeta,
  projectStatusMeta,
} from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  taskCount: number;
  onEdit?: (project: Project) => void;
  onDuplicate?: (projectId: string) => void;
}

function ProjectCardComponent({
  project,
  taskCount,
  onEdit,
  onDuplicate,
}: ProjectCardProps) {
  const { enumLabel, formatDateLocalized, t } = useLocale();

  return (
    <Card className="group overflow-hidden transition duration-150 hover:border-[var(--brand)]">
      <CardContent className="flex h-full min-w-0 flex-col gap-5 p-5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("ring-1", projectStatusMeta[project.status].className)}>
              {enumLabel("projectStatus", project.status)}
            </Badge>
            <Badge className={cn("ring-1", priorityMeta[project.priority].className)}>
              {enumLabel("priority", project.priority)}
            </Badge>
            <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel-soft)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              {enumLabel("direction", project.direction)}
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="break-words font-heading text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">
              {project.name}
            </h3>
            <p className="mt-2 break-words text-sm leading-7 text-[var(--ink-soft)]">
              {project.description}
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-[10px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
          {/* Progress - Enhanced Visual Hierarchy */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--ink-muted)]">{t("project.progressLabel")}</span>
            <span className="text-2xl font-bold text-[var(--ink)]">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />

          {/* Metrics Grid - Clear Visual Separation */}
          <div className="grid grid-cols-1 gap-3 text-sm">
            {/* Budget */}
            <div className="flex items-center gap-2 text-[var(--ink-soft)]">
              <span className="text-base">💰</span>
              <span className="font-medium text-[var(--ink)]">
                {formatCurrency(project.budget.actual, project.budget.currency)}
              </span>
              <span className="text-[var(--ink-muted)]">
                / {formatCurrency(project.budget.planned, project.budget.currency)}
              </span>
            </div>

            {/* Next Milestone */}
            <div className="flex items-center gap-2 text-[var(--ink-soft)]">
              <span className="text-base">📅</span>
              <span className="font-medium text-[var(--ink)]">
                {project.nextMilestone?.name ?? t("project.none")}
              </span>
              {project.nextMilestone && (
                <span className="text-[var(--ink-muted)]">
                  — {formatDateLocalized(project.nextMilestone.date, "d MMM yyyy")}
                </span>
              )}
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-[var(--ink-soft)]">
              <span className="text-base">📍</span>
              <span className="font-medium text-[var(--ink)]">
                {project.location || t("project.none")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {project.team.map((member) => (
                <div
                  key={member}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface-panel)] text-xs font-semibold text-[var(--ink)]"
                  title={member}
                >
                  {initials(member)}
                </div>
              ))}
            </div>
            <div className="text-sm text-[var(--ink-soft)]">
              <div className="font-medium text-[var(--ink)]">
                {project.team.length} {t("dashboard.participants")}
              </div>
              <div>
                {taskCount} {t("dashboard.activeTasks")}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onEdit ? (
              <Button aria-label={`${t("action.edit")}: ${project.name}`} size="sm" variant="secondary" onClick={() => onEdit(project)}>
                <Edit3 className="h-4 w-4" />
                {t("action.edit")}
              </Button>
            ) : null}
            {onDuplicate ? (
              <Button aria-label={`${t("action.duplicate")}: ${project.name}`} size="sm" variant="ghost" onClick={() => onDuplicate(project.id)}>
                <Copy className="h-4 w-4" />
                {t("action.duplicate")}
              </Button>
            ) : null}
            <Link
              aria-label={`${t("action.open")}: ${project.name}`}
              className={buttonVariants({ size: "sm" })}
              href={`/projects/${project.id}`}
            >
              <Flag className="h-4 w-4" />
              {t("action.open")}
              <MoveRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const ProjectCard = memo(ProjectCardComponent);
