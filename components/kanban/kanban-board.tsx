"use client";

import { useState, useEffect, useCallback } from "react";
import { DndContext, DragOverlay, closestCorners, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { KanbanTaskCard } from "./kanban-task-card";
import { ErrorFallbackCard } from "@/components/error-fallback-card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/contexts/locale-context";
import { api } from "@/lib/client/api-error";
import { Plus } from "lucide-react";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import type { Board, Task } from "@/lib/types";

interface KanbanBoardProps {
  boardId: string;
}

export function KanbanBoard({ boardId }: KanbanBoardProps) {
  const { t } = useLocale();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Fetch board data
  const fetchBoard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.get<Board>(`/api/boards/${boardId}`);
      if (!data || !Array.isArray(data.columns)) {
        throw new Error(t("error.loadDescription"));
      }
      setBoard(data);
    } catch (error) {
      console.error("[KanbanBoard] Error fetching board:", error);
      setBoard(null);
      setError(
        error instanceof Error ? error : new Error(t("error.loadDescription"))
      );
    } finally {
      setLoading(false);
    }
  }, [boardId, t]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !board) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Find target column
    const targetColumn = board.columns.find((col) => col.id === overId);
    if (!targetColumn) return;

    // Find current task column
    const currentColumn = board.columns.find((col) =>
      col.tasks.some((t) => t.id === taskId)
    );

    // Skip if same column and not reordering
    if (currentColumn?.id === targetColumn.id) return;

    // Optimistic update - update UI immediately
    const task = currentColumn?.tasks.find((t) => t.id === taskId);
    if (task) {
      setBoard((prevBoard) => {
        if (!prevBoard) return prevBoard;
        
        return {
          ...prevBoard,
          columns: prevBoard.columns.map((col) => {
            if (col.id === currentColumn?.id) {
              // Remove from current column
              return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
            }
            if (col.id === targetColumn.id) {
              // Add to target column
              return { ...col, tasks: [...col.tasks, { ...task, columnId: targetColumn.id }] };
            }
            return col;
          }),
        };
      });
    }

    // Move task to new column (API)
    try {
      await fetch(`/api/tasks/${taskId}/move`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnId: targetColumn.id,
          order: targetColumn.tasks.length,
        }),
      });
      // No refetch needed - optimistic update already applied
    } catch (error) {
      console.error("[KanbanBoard] Error moving task:", error);
      // Rollback on error
      fetchBoard();
    }
  }, [board, fetchBoard]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as string;

    // Find task in columns
    const task = board?.columns
      .flatMap((col) => col.tasks)
      .find((t) => t.id === taskId);

    if (task) {
      setActiveTask(task);
    }
  }, [board]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[var(--ink-muted)]">{t("loading.label")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorFallbackCard
        error={error}
        onRetry={() => {
          void fetchBoard();
        }}
      />
    );
  }

  if (!board) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[var(--ink-muted)]">{t("error.loadDescription")}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">{board.name}</h1>
          <p className="text-sm text-[var(--ink-muted)]">
            {board.project?.name || "Без проекта"}
          </p>
        </div>
        <Button size="sm" onClick={() => setTaskModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить задачу
        </Button>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto p-6">
          <SortableContext
            items={board.columns.map((col) => col.id)}
            strategy={horizontalListSortingStrategy}
          >
            {board.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={column.tasks}
              />
            ))}
          </SortableContext>
        </div>

        <DragOverlay>
          {activeTask ? (
            <KanbanTaskCard task={activeTask} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskFormModal
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        projectId={board.projectId}
      />
    </div>
  );
}
