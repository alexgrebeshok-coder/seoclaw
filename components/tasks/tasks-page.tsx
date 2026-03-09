"use client";

import { useMemo, useState } from "react";
import { CheckSquare2, Download, Filter } from "lucide-react";

import { AIContextActions } from "@/components/ai/ai-context-actions";
import { useDashboard } from "@/components/dashboard-provider";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataErrorState } from "@/components/ui/data-error-state";
import { fieldStyles } from "@/components/ui/field";
import {
  AIContextActionsSkeleton,
  KpiCardSkeleton,
  TaskTableSkeleton,
} from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale } from "@/contexts/locale-context";
import { downloadTasksCsv } from "@/lib/export";
import { useProjects, useTasks } from "@/lib/hooks/use-api";
import { Priority, TaskStatus } from "@/lib/types";
import { priorityMeta, taskStatusMeta } from "@/lib/utils";

export function TasksPage() {
  const { enumLabel, formatDateLocalized, t } = useLocale();
  const { updateTaskStatus } = useDashboard();
  const { error, isLoading, mutate: mutateTasks, tasks } = useTasks();
  const {
    error: projectsError,
    isLoading: projectsLoading,
    mutate: mutateProjects,
    projects,
  } = useProjects();
  const [status, setStatus] = useState<"all" | TaskStatus>("all");
  const [priority, setPriority] = useState<"all" | Priority>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const statusMatch = status === "all" ? true : task.status === status;
        const priorityMatch = priority === "all" ? true : task.priority === priority;
        return statusMatch && priorityMatch;
      }),
    [priority, status, tasks]
  );

  const projectNameById = Object.fromEntries(projects.map((project) => [project.id, project.name]));

  const toggleTask = (taskId: string) => {
    setSelectedIds((current) =>
      current.includes(taskId) ? current.filter((item) => item !== taskId) : [...current, taskId]
    );
  };
  const showHydrationSkeleton =
    isLoading && projectsLoading && projects.length === 0 && tasks.length === 0;

  const handleRetry = () => {
    void Promise.all([mutateProjects(), mutateTasks()]);
  };

  if (showHydrationSkeleton) {
    return (
      <div className="grid gap-6">
        <AIContextActionsSkeleton />

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <KpiCardSkeleton key={index} />
          ))}
        </div>

        <TaskTableSkeleton />
      </div>
    );
  }

  if ((error || projectsError) && projects.length === 0 && tasks.length === 0) {
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

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[var(--ink-muted)]">{t("tasks.total")}</p>
            <p className="mt-2 font-heading text-5xl font-semibold tracking-[-0.08em] text-[var(--ink)]">
              {tasks.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[var(--ink-muted)]">{t("tasks.inProgress")}</p>
            <p className="mt-2 font-heading text-5xl font-semibold tracking-[-0.08em] text-[var(--ink)]">
              {tasks.filter((task) => task.status === "in-progress").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[var(--ink-muted)]">{t("tasks.blocked")}</p>
            <p className="mt-2 font-heading text-5xl font-semibold tracking-[-0.08em] text-[var(--ink)]">
              {tasks.filter((task) => task.status === "blocked").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[var(--ink-muted)]">{t("tasks.selected")}</p>
            <p className="mt-2 font-heading text-5xl font-semibold tracking-[-0.08em] text-[var(--ink)]">
              {selectedIds.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>{t("tasks.title")}</CardTitle>
            <p className="text-sm text-[var(--ink-soft)]">{t("tasks.description")}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <select
              className={fieldStyles}
              onChange={(event) => setStatus(event.target.value as "all" | TaskStatus)}
              value={status}
            >
              <option value="all">{t("filters.allStatuses")}</option>
              <option value="todo">{enumLabel("taskStatus", "todo")}</option>
              <option value="in-progress">{enumLabel("taskStatus", "in-progress")}</option>
              <option value="done">{enumLabel("taskStatus", "done")}</option>
              <option value="blocked">{enumLabel("taskStatus", "blocked")}</option>
            </select>
            <select
              className={fieldStyles}
              onChange={(event) => setPriority(event.target.value as "all" | Priority)}
              value={priority}
            >
              <option value="all">{t("filters.allPriorities")}</option>
              <option value="low">{enumLabel("priority", "low")}</option>
              <option value="medium">{enumLabel("priority", "medium")}</option>
              <option value="high">{enumLabel("priority", "high")}</option>
              <option value="critical">{enumLabel("priority", "critical")}</option>
            </select>
            <Button onClick={() => setTaskModalOpen(true)}>{t("action.addTask")}</Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={!selectedIds.length}
              onClick={() => updateTaskStatus(selectedIds, "in-progress")}
              variant="secondary"
            >
              <Filter className="h-4 w-4" />
              {t("tasks.bulkMove")}
            </Button>
            <Button
              disabled={!selectedIds.length}
              onClick={() => updateTaskStatus(selectedIds, "done")}
              variant="secondary"
            >
              <CheckSquare2 className="h-4 w-4" />
              {t("tasks.bulkDone")}
            </Button>
            <Button onClick={() => downloadTasksCsv(filteredTasks)} variant="outline">
              <Download className="h-4 w-4" />
              {t("action.exportExcel")}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead />
                <TableHead>{t("project.tasks")}</TableHead>
                <TableHead>{t("tasks.project")}</TableHead>
                <TableHead>{t("field.status")}</TableHead>
                <TableHead>{t("tasks.assignee")}</TableHead>
                <TableHead>{t("tasks.dueDate")}</TableHead>
                <TableHead>{t("tasks.priority")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <input
                      checked={selectedIds.includes(task.id)}
                      onChange={() => toggleTask(task.id)}
                      type="checkbox"
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-[var(--ink)]">{task.title}</p>
                      <p className="text-sm text-[var(--ink-soft)]">{task.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>{projectNameById[task.projectId]}</TableCell>
                  <TableCell>
                    <Badge className={taskStatusMeta[task.status].className}>
                      {enumLabel("taskStatus", task.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{task.assignee}</TableCell>
                  <TableCell>{formatDateLocalized(task.dueDate, "d MMM yyyy")}</TableCell>
                  <TableCell>
                    <Badge className={priorityMeta[task.priority].className}>
                      {enumLabel("priority", task.priority)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TaskFormModal open={taskModalOpen} onOpenChange={setTaskModalOpen} />
    </div>
  );
}
