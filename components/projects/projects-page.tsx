"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import { AIContextActions } from "@/components/ai/ai-context-actions";
import { useDashboard } from "@/components/dashboard-provider";
import { ProjectFormModal } from "@/components/projects/project-form-modal";
import { ProjectCard } from "@/components/projects/project-card";
import { Badge } from "@/components/ui/badge";
import { ClientChart } from "@/components/ui/client-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataErrorState } from "@/components/ui/data-error-state";
import { fieldStyles } from "@/components/ui/field";
import { ChartSkeleton, ProjectCardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/contexts/locale-context";
import { useProjects, useTasks } from "@/lib/hooks/use-api";
import { Project } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const ProjectsComparisonChart = dynamic(
  () =>
    import("@/components/projects/projects-comparison-chart").then(
      (module) => module.ProjectsComparisonChart
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

export function ProjectsPage({ initialQuery = "" }: { initialQuery?: string }) {
  const { enumLabel, t } = useLocale();
  const { duplicateProject } = useDashboard();
  const { error, isLoading, mutate: mutateProjects, projects } = useProjects();
  const {
    error: tasksError,
    isLoading: tasksLoading,
    mutate: mutateTasks,
    tasks,
  } = useTasks();
  const [query, setQuery] = useState(initialQuery);
  const [direction, setDirection] = useState<"all" | Project["direction"]>("all");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const queryMatch =
          query.trim().length === 0
            ? true
            : [project.name, project.description, project.location]
                .join(" ")
                .toLowerCase()
                .includes(query.toLowerCase());
        const directionMatch = direction === "all" ? true : project.direction === direction;
        return queryMatch && directionMatch;
      }),
    [direction, projects, query]
  );

  const compareData = filteredProjects.map((project) => ({
    name: project.name.slice(0, 12),
    progress: project.progress,
    health: project.health,
    budget: Math.round((project.budget.actual / project.budget.planned) * 100),
  }));
  const showHydrationSkeleton =
    isLoading && tasksLoading && projects.length === 0 && tasks.length === 0;

  const handleRetry = () => {
    void Promise.all([mutateProjects(), mutateTasks()]);
  };

  if (showHydrationSkeleton) {
    return (
      <div className="grid gap-6">
        <AIContextActions />

        <Card>
          <CardHeader className="flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-52" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(280px,1fr)_220px_auto]">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-44" />
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <ProjectCardSkeleton key={index} />
              ))}
            </div>
            <Card className="bg-[color:var(--surface-panel)]">
              <CardContent className="space-y-6 p-6">
                <Skeleton className="h-7 w-44" />
                <ChartSkeleton className="h-[320px]" />
                <div className="grid gap-3">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div
                      key={index}
                      className="rounded-[10px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                          <Skeleton className="h-5 w-4/5" />
                          <Skeleton className="h-4 w-3/5" />
                        </div>
                        <Skeleton className="h-8 w-16 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    );
  }

  if ((error || tasksError) && projects.length === 0 && tasks.length === 0) {
    return (
      <DataErrorState
        actionLabel={t("action.retry")}
        description={t("error.loadDescription")}
        onRetry={handleRetry}
        title={t("error.loadTitle")}
      />
    );
  }

  return (
    <>
      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle>{t("projects.portfolioView")}</CardTitle>
              <p className="text-sm leading-6 text-[var(--ink-soft)]">
                {t("projects.portfolioViewDescription")}
              </p>
            </div>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-[minmax(280px,1fr)_220px_auto]">
              <input
                className={fieldStyles}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("placeholder.search")}
                value={query}
              />
              <select
                className={fieldStyles}
                onChange={(event) => setDirection(event.target.value as "all" | Project["direction"])}
                value={direction}
              >
                <option value="all">{t("filters.allDirections")}</option>
                {(["metallurgy", "logistics", "trade", "construction"] as const).map((value) => (
                  <option key={value} value={value}>
                    {enumLabel("direction", value)}
                  </option>
                ))}
              </select>
              <Button onClick={() => setProjectModalOpen(true)}>{t("action.addProject")}</Button>
            </div>
          </CardHeader>
          <CardContent className="grid min-w-0 gap-6 grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
            <div className="grid min-w-0 gap-4 grid-cols-1 lg:grid-cols-2">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  onDuplicate={duplicateProject}
                  onEdit={setEditingProject}
                  project={project}
                  taskCount={tasks.filter((task) => task.projectId === project.id && task.status !== "done").length}
                />
              ))}
            </div>
            <Card className="min-w-0 bg-[color:var(--surface-panel)]">
              <CardHeader>
                <CardTitle>{t("projects.comparison")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ClientChart className="h-[320px]">
                  <ProjectsComparisonChart data={compareData} />
                </ClientChart>
                <div className="grid gap-3">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-[10px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-[var(--ink)]">{project.name}</p>
                        <p className="text-sm text-[var(--ink-soft)]">
                          {formatCurrency(project.budget.actual, project.budget.currency)} /{" "}
                          {formatCurrency(project.budget.planned, project.budget.currency)}
                        </p>
                      </div>
                      <Badge variant={project.status === "at-risk" ? "danger" : "success"}>
                        {project.health}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>

      <ProjectFormModal
        open={projectModalOpen}
        onOpenChange={setProjectModalOpen}
      />
      <ProjectFormModal
        open={Boolean(editingProject)}
        onOpenChange={(open) => {
          if (!open) setEditingProject(null);
        }}
        project={editingProject}
      />
    </>
  );
}
