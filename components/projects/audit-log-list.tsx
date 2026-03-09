"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AuditLogEntry } from "@/lib/types";

// Вынесено за компонент для оптимизации
const ACTION_LABELS: Record<string, string> = {
  created: "Создан",
  updated: "Обновлён",
  status_changed: "Статус изменён",
  milestone_reached: "Милестон достигнут",
};

const ACTION_VARIANTS: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  created: "success",
  updated: "neutral",
  status_changed: "info",
  milestone_reached: "success",
};

function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function getActionVariant(action: string): "neutral" | "success" | "warning" | "danger" | "info" {
  return ACTION_VARIANTS[action] ?? "neutral";
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AuditLogListProps {
  projectId: string;
  entries: AuditLogEntry[];
}

/**
 * Компонент для отображения истории изменений проекта
 * @param projectId - ID проекта
 * @param entries - Массив записей истории
 */
export const AuditLogList = function AuditLogList({ projectId, entries }: AuditLogListProps) {
  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.projectId === projectId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [projectId, entries]);

  if (filteredEntries.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Нет записей в истории
      </Card>
    );
  }

  return (
    <div className="space-y-3" role="list" aria-label="История изменений проекта">
      {filteredEntries.map((entry) => (
        <Card key={entry.id} className="p-4" role="listitem">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={getActionVariant(entry.action)}>
                  {getActionLabel(entry.action)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {entry.userName}
                </span>
              </div>
              <p className="text-sm">{entry.details}</p>
            </div>
            <time className="text-xs text-muted-foreground whitespace-nowrap">
              {formatTimestamp(entry.timestamp)}
            </time>
          </div>
        </Card>
      ))}
    </div>
  );
};
