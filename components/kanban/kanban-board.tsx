"use client";

import { useEffect, useMemo, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

import { AIContextActions } from "@/components/ai/ai-context-actions";
import { useDashboard } from "@/components/dashboard-provider";
import { KanbanCardOverlay } from "@/components/kanban/kanban-card";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataErrorState } from "@/components/ui/data-error-state";
import { fieldStyles } from "@/components/ui/field";
import {
  AIContextActionsSkeleton,
  KanbanColumnSkeleton,
  KpiCardSkeleton,
  Skeleton,
} from "@/components/ui/skeleton";
import { useLocale } from "@/contexts/locale-context";
import { useProjects, useTasks } from "@/lib/hooks/use-api";
import type { Task, TaskStatus } from "@/lib/types";

const columnOrder: TaskStatus[] = ["blocked", "todo", "in-progress", "done"];

type KanbanColumns = Record<TaskStatus, string[]>;

function buildColumns(tasks: Task[]): KanbanColumns {
  return {
    blocked: tasks
      .filter((task) => task.status === "blocked")
      .sort((left, right) => left.order - right.order)
      .map((task) => task.id),
    todo: tasks
      .filter((task) => task.status === "todo")
      .sort((left, right) => left.order - right.order)
      .map((task) => task.id),
    "in-progress": tasks
      .filter((task) => task.status === "in-progress")
      .sort((left, right) => left.order - right.order)
      .map((task) => task.id),
    done: tasks
      .filter((task) => task.status === "done")
      .sort((left, right) => left.order - right.order)
      .map((task) => task.id),
  };
}

function findTaskColumn(columns: KanbanColumns, taskId: string) {
  return columnOrder.find((columnId) => columns[columnId].includes(taskId)) ?? null;
}

function resolveOverColumn(columns: KanbanColumns, overId: string) {
  if (overId.startsWith("column-")) {
    return overId.replace("column-", "") as TaskStatus;
  }

  return findTaskColumn(columns, overId);
}

function areColumnsEqual(left: KanbanColumns, right: KanbanColumns) {
  return columnOrder.every((columnId) => {
    if (left[columnId].length !== right[columnId].length) {
      return false;
    }

    return left[columnId].every((taskId, index) => taskId === right[columnId][index]);
  });
}

export function KanbanBoard() {
  const { reorderKanbanTasks } = useDashboard();
  const { error: projectsError, isLoading: projectsLoading, mutate: mutateProjects, projects } =
    useProjects();
  const { t } = useLocale();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    () => (projects.find((project) => project.status === "active") ?? projects[0])?.id ?? null
  );
  const taskFilters = useMemo(
    () => (selectedProjectId ? { projectId: selectedProjectId } : undefined),
    [selectedProjectId]
  );
  const {
    error: tasksError,
    isLoading: tasksLoading,
    mutate: mutateTasks,
    tasks,
  } = useTasks(taskFilters);
  const [columns, setColumns] = useState<KanbanColumns>({
    blocked: [],
    todo: [],
    "in-progress": [],
    done: [],
  });
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (selectedProjectId && projects.some((project) => project.id === selectedProjectId)) {
      return;
    }
    const defaultProject = projects.find((project) => project.status === "active") ?? projects[0];
    if (defaultProject) {
      setSelectedProjectId(defaultProject.id);
    }
  }, [projects, selectedProjectId]);

  const selectedProjectTasks = useMemo(
    () =>
      tasks.filter((task) => (selectedProjectId ? task.projectId === selectedProjectId : false)),
    [selectedProjectId, tasks]
  );
  const derivedColumns = useMemo(
    () => buildColumns(selectedProjectTasks),
    [selectedProjectTasks]
  );

  useEffect(() => {
    setColumns((current) => (areColumnsEqual(current, derivedColumns) ? current : derivedColumns));
  }, [derivedColumns]);

  const taskById = useMemo(
    () =>
      Object.fromEntries(
        selectedProjectTasks.map((task) => [task.id, task] as const)
      ) as Record<string, Task>,
    [selectedProjectTasks]
  );

  const activeTask = activeTaskId ? taskById[activeTaskId] : null;
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const completedCount = selectedProjectTasks.filter((task) => task.status === "done").length;
  const activeCount = selectedProjectTasks.filter(
    (task) => task.status === "in-progress"
  ).length;
  const showHydrationSkeleton =
    projectsLoading && tasksLoading && projects.length === 0 && tasks.length === 0;

  const handleRetry = () => {
    void Promise.all([mutateProjects(), mutateTasks()]);
  };

  const moveCard = (currentColumns: KanbanColumns, activeId: string, overId: string) => {
    const activeColumn = findTaskColumn(currentColumns, activeId);
    const overColumn = resolveOverColumn(currentColumns, overId);
    if (!activeColumn || !overColumn) return currentColumns;

    const nextColumns: KanbanColumns = {
      blocked: [...currentColumns.blocked],
      todo: [...currentColumns.todo],
      "in-progress": [...currentColumns["in-progress"]],
      done: [...currentColumns.done],
    };

    nextColumns[activeColumn] = nextColumns[activeColumn].filter((id) => id !== activeId);

    const targetIds = nextColumns[overColumn];
    const overIndex = overId.startsWith("column-") ? targetIds.length : targetIds.indexOf(overId);
    const nextIndex = overIndex >= 0 ? overIndex : targetIds.length;
    targetIds.splice(nextIndex, 0, activeId);

    return nextColumns;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;

    setColumns((current) => {
      const activeId = String(event.active.id);
      if (activeId === overId) {
        return current;
      }

      return moveCard(current, activeId, overId);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const overId = event.over?.id ? String(event.over.id) : null;
    setActiveTaskId(null);

    if (!selectedProjectId || !overId) {
      setColumns(derivedColumns);
      return;
    }

    const nextColumns = moveCard(columns, String(event.active.id), overId);
    setColumns(nextColumns);
    reorderKanbanTasks(selectedProjectId, nextColumns);
  };

  if (showHydrationSkeleton) {
    return (
      <div className="grid gap-6">
        <AIContextActionsSkeleton />

        <Card>
          <CardHeader className="flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="grid gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-[320px]" />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="rounded-[8px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-10 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <KpiCardSkeleton key={index} />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <KanbanColumnSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if ((projectsError || tasksError) && projects.length === 0 && tasks.length === 0) {
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
    <div className="grid gap-6">
      <AIContextActions />

      <Card>
        <CardHeader className="flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>{t("page.kanban.title")}</CardTitle>
            <p className="text-sm leading-7 text-[var(--ink-soft)]">{t("kanban.description")}</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,320px)]">
            <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
              <span>{t("kanban.projectFilter")}</span>
              <select
                className={fieldStyles}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                value={selectedProjectId ?? ""}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
            <p className="text-sm text-[var(--ink-muted)]">{t("tasks.total")}</p>
            <p className="mt-2 font-heading text-4xl font-semibold tracking-[-0.06em] text-[var(--ink)]">
              {selectedProjectTasks.length}
            </p>
          </div>
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
            <p className="text-sm text-[var(--ink-muted)]">{t("tasks.inProgress")}</p>
            <p className="mt-2 font-heading text-4xl font-semibold tracking-[-0.06em] text-[var(--ink)]">
              {activeCount}
            </p>
          </div>
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
            <p className="text-sm text-[var(--ink-muted)]">{t("kanban.column.done")}</p>
            <p className="mt-2 font-heading text-4xl font-semibold tracking-[-0.06em] text-[var(--ink)]">
              {completedCount}
            </p>
          </div>
        </CardContent>
      </Card>

      {selectedProject ? (
        <DndContext
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragStart={handleDragStart}
          sensors={sensors}
        >
          <div className="grid gap-4 xl:grid-cols-4">
            <KanbanColumn
              columnId="blocked"
              projectId={selectedProject.id}
              tasks={columns.blocked.map((id) => taskById[id]).filter(Boolean)}
              title={t("kanban.column.backlog")}
            />
            <KanbanColumn
              columnId="todo"
              projectId={selectedProject.id}
              tasks={columns.todo.map((id) => taskById[id]).filter(Boolean)}
              title={t("kanban.column.todo")}
            />
            <KanbanColumn
              columnId="in-progress"
              projectId={selectedProject.id}
              tasks={columns["in-progress"].map((id) => taskById[id]).filter(Boolean)}
              title={t("kanban.column.inProgress")}
            />
            <KanbanColumn
              columnId="done"
              projectId={selectedProject.id}
              tasks={columns.done.map((id) => taskById[id]).filter(Boolean)}
              title={t("kanban.column.done")}
            />
          </div>

          <DragOverlay>
            {activeTask ? <KanbanCardOverlay task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <h3 className="font-heading text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
              {t("kanban.emptyTitle")}
            </h3>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              {t("kanban.emptyDescription")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
