"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { DataErrorState } from "@/components/ui/data-error-state";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/client/api-error";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
  resource: {
    projectId: string;
    projectName: string;
  };
}

const DAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

export const CalendarView = React.memo(function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>(0);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.get<unknown>("/api/calendar/events");
      setEvents(Array.isArray(data) ? (data as CalendarEvent[]) : []);
    } catch (error) {
      console.error("[CalendarView] Error:", error);
      setEvents([]);
      setError("Календарь не смог синхронизироваться с API. Можно повторить запрос.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const getDaysInMonth = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    
    // Add days from previous month
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add days from next month
    const endPadding = 42 - days.length; // 6 weeks
    for (let i = 1; i <= endPadding; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  }, []);

  // P3-2: Pre-index events by date to avoid filtering on every day cell render
  const eventsByDate = useMemo(() => {
    const index = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const dateStr = new Date(event.start).toISOString().split("T")[0];
      if (!index.has(dateStr)) {
        index.set(dateStr, []);
      }
      index.get(dateStr)!.push(event);
    }
    return index;
  }, [events]);

  const getEventsForDay = useCallback((date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return eventsByDate.get(dateStr) || [];
  }, [eventsByDate]);

  const handleMonthChange = useCallback((direction: 'prev' | 'next') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Cancel any pending animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    const newDate = direction === 'prev'
      ? new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    
    setCurrentDate(newDate);
    
    // Reset animation state after transition
    animationRef.current = requestAnimationFrame(() => {
      setTimeout(() => setIsAnimating(false), 300);
    });
  }, [currentDate, isAnimating]);

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-96 animate-pulse rounded bg-[var(--surface-secondary)]" />
      </Card>
    );
  }

  if (error) {
    return (
      <DataErrorState
        actionLabel="Попробовать снова"
        description={error}
        onRetry={() => {
          void fetchEvents();
        }}
        title="Что-то пошло не так"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold transition-all duration-300">
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleMonthChange('prev')}
            disabled={isAnimating}
            className={cn(
              "rounded-lg border border-[var(--line)] p-2 transition-all duration-200",
              "hover:bg-[var(--surface-secondary)] hover:scale-105",
              "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleMonthChange('next')}
            disabled={isAnimating}
            className={cn(
              "rounded-lg border border-[var(--line)] p-2 transition-all duration-200",
              "hover:bg-[var(--surface-secondary)] hover:scale-105",
              "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden p-0">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[var(--line)]">
          {DAYS.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-[var(--ink-muted)]"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid with animation */}
        <div 
          className={cn(
            "grid grid-cols-7 transition-opacity duration-300",
            isAnimating && "opacity-50"
          )}
        >
          {days.map((date, index) => {
            const dayEvents = getEventsForDay(date);
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = date.getTime() === today.getTime();

            return (
              <div
                key={index}
                className={cn(
                  "min-h-[100px] border-b border-r border-[var(--line)] p-2",
                  "transition-all duration-200 hover:bg-[var(--surface-secondary)]/50",
                  !isCurrentMonth && "bg-[var(--surface-secondary)]/50"
                )}
              >
                <div
                  className={cn(
                    "mb-1 text-sm font-medium transition-all duration-200",
                    !isCurrentMonth && "text-[var(--ink-muted)]",
                    isToday && "flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-white scale-110"
                  )}
                >
                  {date.getDate()}
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="truncate rounded px-1 py-0.5 text-xs transition-all duration-200 hover:scale-105 cursor-pointer"
                      style={{ backgroundColor: event.color + "20", color: event.color }}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-[var(--ink-muted)]">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded" style={{ backgroundColor: "#3b82f6" }} />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded" style={{ backgroundColor: "#22c55e" }} />
          <span>Done</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded" style={{ backgroundColor: "#f43f5e" }} />
          <span>Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded" style={{ backgroundColor: "#94a3b8" }} />
          <span>Todo</span>
        </div>
      </div>
    </div>
  );
});
