"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Play, Square, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TimerWidgetProps {
  taskId: string;
  taskTitle: string;
  onTimeUpdate?: (duration: number) => void;
}

export const TimerWidget = React.memo(function TimerWidget({
  taskId,
  taskTitle,
  onTimeUpdate,
}: TimerWidgetProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Update timer every second
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStartTimer = useCallback(async () => {
    try {
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          description: `Working on: ${taskTitle}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEntryId(data.id);
        setStartTime(new Date(data.startTime));
        setIsRunning(true);
        setElapsedSeconds(0);
      }
    } catch (error) {
        console.error("[TimerWidget] Error starting timer:", error);
    }
  }, [taskId, taskTitle]);

  const handleStopTimer = useCallback(async () => {
    if (!entryId) return;

    try {
      const response = await fetch(`/api/time-entries/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        setIsRunning(false);
        onTimeUpdate?.(data.duration || 0);
        setEntryId(null);
        setStartTime(null);
      }
    } catch (error) {
      console.error("[TimerWidget] Error stopping timer:", error);
    }
  }, [entryId, onTimeUpdate]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className={cn(
            "h-4 w-4",
            isRunning && "animate-spin text-[var(--accent)]"
          )} />
          <span className="font-medium">{taskTitle}</span>
        </div>

        {isRunning ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-semibold">
              {formatTime(elapsedSeconds)}
            </span>
            <Button
              size="sm"
              variant="danger"
              onClick={handleStopTimer}
              aria-label="Stop timer"
            >
              <Square className="h-4 w-4" />
              Stop
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={handleStartTimer} aria-label="Start timer">
            <Play className="mr-2 h-4 w-4" />
            Start Timer
          </Button>
        )}
      </div>

      {isRunning && startTime && (
        <div className="mt-2 text-xs text-[var(--ink-muted)]">
          Started at {startTime.toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}
    </Card>
  );
});
