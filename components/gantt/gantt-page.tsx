"use client";

import { Fragment, useMemo, useState } from "react";
import {
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  endOfWeek,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { useDashboard } from "@/components/dashboard-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fieldStyles } from "@/components/ui/field";
import { useLocale } from "@/contexts/locale-context";
import { getTodayDate } from "@/lib/date";

type Scale = "week" | "month";

function getOverlapIndex(
  itemStart: Date,
  itemEnd: Date,
  boundaries: { start: Date; end: Date }[]
) {
  const startIndex = boundaries.findIndex((boundary) => !isAfter(boundary.start, itemEnd) && !isBefore(boundary.end, itemStart));
  if (startIndex === -1) return null;

  let endIndex = startIndex;
  for (let index = startIndex; index < boundaries.length; index += 1) {
    if (!isAfter(boundaries[index].start, itemEnd) && !isBefore(boundaries[index].end, itemStart)) {
      endIndex = index;
    }
  }

  return { startIndex, endIndex };
}

export function GanttPage() {
  const { enumLabel, formatDateLocalized, t } = useLocale();
  const { milestones, projects } = useDashboard();
  const [scale, setScale] = useState<Scale>("week");
  const [projectFilter, setProjectFilter] = useState<"all" | string>("all");

  const items = useMemo(() => {
    const relevantProjects =
      projectFilter === "all"
        ? projects
        : projects.filter((project) => project.id === projectFilter);

    return relevantProjects.flatMap((project) => [
      {
        id: project.id,
        kind: "project" as const,
        label: project.name,
        start: project.dates.start,
        end: project.dates.end,
        status: project.status,
        meta: `${project.progress}%`,
      },
      ...milestones
        .filter((milestone) => milestone.projectId === project.id)
        .map((milestone) => ({
          id: milestone.id,
          kind: "milestone" as const,
          label: milestone.name,
          start: milestone.start,
          end: milestone.end,
          status: milestone.status,
          meta: `${milestone.progress}%`,
        })),
    ]);
  }, [milestones, projectFilter, projects]);

  const overallStart = startOfMonth(
    items.reduce((min, item) => {
      const date = parseISO(item.start);
      return isBefore(date, min) ? date : min;
    }, parseISO(items[0]?.start ?? "2026-01-01"))
  );

  const overallEnd = (() => {
    const maxItemDate = items.reduce((max, item) => {
      const date = parseISO(item.end);
      return isAfter(date, max) ? date : max;
    }, parseISO(items[0]?.end ?? "2026-12-31"));

    // Minimum 1 year from today
    const oneYearFromToday = new Date();
    oneYearFromToday.setFullYear(oneYearFromToday.getFullYear() + 1);

    return endOfMonth(isAfter(maxItemDate, oneYearFromToday) ? maxItemDate : oneYearFromToday);
  })();

  const columns = scale === "week" ? eachWeekOfInterval({ start: overallStart, end: overallEnd }, { weekStartsOn: 1 }) : eachMonthOfInterval({ start: overallStart, end: overallEnd });

  const columnBoundaries = columns.map((column) =>
    scale === "week"
      ? { start: startOfWeek(column, { weekStartsOn: 1 }), end: endOfWeek(column, { weekStartsOn: 1 }) }
      : { start: startOfMonth(column), end: endOfMonth(column) }
  );

  const today = getTodayDate();
  const todayIndex = columnBoundaries.findIndex((boundary) => !isBefore(today, boundary.start) && !isAfter(today, boundary.end));

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>{t("gantt.title")}</CardTitle>
            <p className="text-sm text-[var(--ink-soft)]">
              {t("gantt.description")}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <select className={fieldStyles} onChange={(event) => setProjectFilter(event.target.value)} value={projectFilter}>
              <option value="all">{t("filters.allProjects")}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <select className={fieldStyles} onChange={(event) => setScale(event.target.value as Scale)} value={scale}>
              <option value="week">{t("filters.week")}</option>
              <option value="month">{t("filters.month")}</option>
            </select>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div
            className="min-w-[1200px]"
            style={{
              display: "grid",
              gridTemplateColumns: `280px repeat(${columns.length}, minmax(84px, 1fr))`,
            }}
          >
            <div className="sticky left-0 z-10 border-b border-r border-[var(--line)] bg-[color:var(--surface-panel)] p-4 font-semibold text-[var(--ink)]">
              {t("gantt.item")}
            </div>
            {columns.map((column, index) => (
              <div
                key={column.toISOString()}
                className="border-b border-r border-[var(--line)] bg-[var(--panel-soft)]/70 px-2 py-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]"
              >
                {scale === "week"
                  ? formatDateLocalized(column.toISOString(), "dd MMM")
                  : formatDateLocalized(column.toISOString(), "MMM yyyy")}
                {todayIndex === index ? (
                  <div className="mt-2 rounded-full bg-rose-500 px-2 py-1 text-[10px] text-white">
                    {t("gantt.today")}
                  </div>
                ) : null}
              </div>
            ))}

            {items.map((item) => {
              const overlap = getOverlapIndex(parseISO(item.start), parseISO(item.end), columnBoundaries);
              return (
                <Fragment key={item.id}>
                  <div
                    className="sticky left-0 z-10 border-b border-r border-[var(--line)] bg-[color:var(--surface-panel)] p-4"
                  >
                    <div className="font-medium text-[var(--ink)]">{item.label}</div>
                    <div className="text-sm text-[var(--ink-soft)]">
                      {item.kind === "project" ? t("nav.projects") : t("calendar.milestone")} • {item.meta}
                    </div>
                  </div>
                  <div
                    className="relative col-span-full border-b border-[var(--line)]"
                    style={{ gridColumn: `2 / span ${columns.length}` }}
                  >
                    <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(84px, 1fr))` }}>
                      {columns.map((column, index) => (
                        <div key={`${item.id}-${column.toISOString()}`} className="border-r border-[var(--line)]" />
                      ))}
                    </div>
                    {overlap ? (
                      <div
                        className="relative grid h-[72px]"
                        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(84px, 1fr))` }}
                      >
                        <div
                          className="z-[1] m-3 flex items-center rounded-[10px] px-4 text-sm font-semibold text-white"
                          style={{
                            gridColumn: `${overlap.startIndex + 1} / ${overlap.endIndex + 2}`,
                            background:
                              item.kind === "project"
                                ? "linear-gradient(135deg, #0f172a 0%, #2563eb 100%)"
                                : `linear-gradient(135deg, ${
                                    item.status === "at-risk"
                                      ? "#fb7185 0%, #f97316 100%"
                                      : item.status === "completed"
                                        ? "#10b981 0%, #0f766e 100%"
                                        : "#38bdf8 0%, #2563eb 100%"
                                  })`,
                          }}
                        >
                          {enumLabel("projectStatus", item.status)}
                        </div>
                      </div>
                    ) : (
                      <div className="h-[72px]" />
                    )}
                  </div>
                </Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
