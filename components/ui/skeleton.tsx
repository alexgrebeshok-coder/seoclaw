import { type HTMLAttributes } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("desktop-skeleton rounded-md", className)} {...props} />;
}

export function ChartSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-full w-full rounded-lg", className)} />;
}

export function KpiCardSkeleton() {
  return (
    <Card className="app-shell-surface">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="w-full space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-11 w-24" />
          </div>
          <Skeleton className="h-10 w-10 rounded-[10px]" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </CardContent>
    </Card>
  );
}

export function ProjectCardSkeleton() {
  return (
    <Card className="app-shell-surface overflow-hidden">
      <CardContent className="flex h-full flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/5" />
          </div>
          <Skeleton className="h-8 w-32 rounded-[8px]" />
        </div>

        <div className="space-y-3 rounded-[10px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[150px] flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="min-w-[150px] flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="min-w-[150px] flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AIContextActionsSkeleton() {
  return (
    <Card className="app-shell-surface overflow-hidden">
      <CardContent className="grid gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-7 w-44 rounded-full" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-[520px] max-w-full" />
          </div>
          <Skeleton className="h-11 w-48" />
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="rounded-md border border-[var(--line)] bg-[var(--surface-panel-strong)] p-4"
            >
              <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TaskTableSkeleton() {
  return (
    <Card className="app-shell-surface">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Skeleton className="h-12 w-[190px]" />
            <Skeleton className="h-12 w-[190px]" />
            <Skeleton className="h-12 w-[160px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-11 w-36" />
          <Skeleton className="h-11 w-52" />
          <Skeleton className="h-11 w-44" />
        </div>
        <div className="overflow-hidden rounded-[12px] border border-[var(--line-strong)] bg-[var(--surface-panel)]">
          <div className="grid grid-cols-[56px_2fr_1.2fr_1fr_1fr_1fr_1fr] gap-3 border-b border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
            {Array.from({ length: 7 }, (_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
          <div className="grid gap-0">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="grid grid-cols-[56px_2fr_1.2fr_1fr_1fr_1fr_1fr] gap-3 border-b border-[var(--line)] px-4 py-4 last:border-b-0"
              >
                <Skeleton className="h-5 w-5 rounded-[4px]" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-7 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KanbanColumnSkeleton() {
  return (
    <Card className="app-shell-surface min-h-[520px]">
      <CardHeader className="border-b border-[var(--line)]">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 p-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="rounded-[10px] border border-[var(--line)] bg-[var(--panel-soft)] p-3"
          >
            <div className="space-y-3">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
