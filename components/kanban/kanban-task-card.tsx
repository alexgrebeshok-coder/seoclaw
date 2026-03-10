"use client";

import React, { useMemo, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface KanbanTaskCardProps {
  task: Task;
  isDragging?: boolean;
}

// Priority colors - memoized outside component
const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export const KanbanTaskCard = React.memo(function KanbanTaskCard({ task, isDragging }: KanbanTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms ease",
  };

  const priorityColor = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium;

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      // Allow keyboard activation
      e.preventDefault();
    }
  }, []);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="listitem"
      aria-label={`Задача: ${task.title}, приоритет: ${task.priority}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "cursor-grab p-3 transition-all duration-200",
        "active:cursor-grabbing focus:ring-2 focus:ring-[var(--accent)] focus:outline-none",
        "hover:shadow-md hover:scale-[1.02]",
        (isDragging || isSortableDragging) && "opacity-50 scale-105 shadow-lg",
        isOverdue && "border-l-4 border-l-red-500"
      )}
    >
      {/* Title */}
      <h4 className="mb-2 font-medium leading-tight">{task.title}</h4>

      {/* Priority Badge */}
      <div className="mb-2 flex items-center gap-2">
        <Badge
          variant="neutral"
          className={priorityColor}
        >
          {task.priority}
        </Badge>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-[var(--ink-muted)]">
        {/* Due Date */}
        {task.dueDate && (
          <div className={cn("flex items-center gap-1", isOverdue && "text-red-500")}>
            <Calendar className="h-3 w-3" />
            <span>{new Date(task.dueDate).toLocaleDateString("ru-RU")}</span>
          </div>
        )}

        {/* Assignee */}
        {task.assignee && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{task.assignee.initials || task.assignee.name}</span>
          </div>
        )}
      </div>
    </Card>
  );
});
