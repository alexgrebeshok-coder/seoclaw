"use client";

import { CalendarView } from "@/components/calendar/calendar-view";

export default function CalendarPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          Task deadlines and milestones
        </p>
      </div>

      <CalendarView />
    </div>
  );
}
