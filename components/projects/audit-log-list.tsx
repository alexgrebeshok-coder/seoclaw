"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AuditLogEntry } from "@/lib/types";

interface AuditLogListProps {
  projectId: string;
  entries: AuditLogEntry[];
}

export function AuditLogList({ projectId, entries }: AuditLogListProps) {
  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.projectId === projectId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [projectId, entries]);

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      created: "Создан",
      updated: "Обновлён",
      status_changed: "Статус изменён",
      milestone_reached: "Милестон достигнут",
    };
    return labels[action] || action;
  };

  const getActionVariant = (action: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      created: "default",
      updated: "secondary",
      status_changed: "outline",
      milestone_reached: "default",
    };
    return variants[action] || "outline";
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (filteredEntries.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Нет записей в истории
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {filteredEntries.map((entry) => (
        <Card key={entry.id} className="p-4">
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
              {formatDate(entry.timestamp)}
            </time>
          </div>
        </Card>
      ))}
    </div>
  );
}
