"use client";

import { memo, type ButtonHTMLAttributes } from "react";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/contexts/locale-context";
import type { Task } from "@/lib/types";
import { cn, priorityMeta } from "@/lib/utils";

function KanbanCardBody({
  dragHandleProps,
  isDragging,
  task,
}: {
  dragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
  task: Task;
}) {
  const { enumLabel, formatDateLocalized, t } = useLocale();

  return (
    <article
      className={cn(
        "rounded-[10px] border border-[var(--line)] bg-[var(--panel-soft)] p-3 transition hover:bg-[var(--panel-soft-strong)]",
        isDragging && "opacity-75 border-[var(--brand)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              aria-label={t("action.open")}
              className="flex h-7 w-7 cursor-grab items-center justify-center rounded-[8px] bg-[color:var(--surface-panel)] text-[var(--ink-muted)] active:cursor-grabbing"
              type="button"
              {...dragHandleProps}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <Badge className={cn("ring-1", priorityMeta[task.priority].className)}>
              {enumLabel("priority", task.priority)}
            </Badge>
          </div>
          <div>
            <h4 className="font-medium leading-6 text-[var(--ink)]">{task.title}</h4>
            <p className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">{task.description}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--ink-muted)]">
        <span className="rounded-[8px] bg-[color:var(--surface-panel)] px-2.5 py-1">{task.assignee?.name || "-"}</span>
        <span className="inline-flex items-center gap-1 rounded-[8px] bg-[color:var(--surface-panel)] px-2.5 py-1">
          <CalendarClock className="h-3.5 w-3.5" />
          {formatDateLocalized(task.dueDate, "d MMM")}
        </span>
      </div>

      {task.blockedReason ? (
        <div className="mt-3 rounded-[8px] border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
          {task.blockedReason}
        </div>
      ) : null}
    </article>
  );
}

export function KanbanCard({ task }: { task: Task }) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      taskId: task.id,
      columnId: task.status,
    },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <KanbanCardBody
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
        task={task}
      />
    </div>
  );
}

function KanbanCardOverlayComponent({ task }: { task: Task }) {
  return <KanbanCardBody isDragging task={task} />;
}

export const KanbanCardOverlay = memo(KanbanCardOverlayComponent);
