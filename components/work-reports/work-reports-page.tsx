import Link from "next/link";

import { DomainApiCard } from "@/components/layout/domain-api-card";
import { DomainPageHeader } from "@/components/layout/domain-page-header";
import { buttonVariants } from "@/components/ui/button";
import { EscalationQueueCard } from "@/components/work-reports/escalation-queue-card";
import { ReportBuilderForm } from "@/components/work-reports/report-builder-form";
import { ReportRunsTable } from "@/components/work-reports/report-runs-table";
import { WorkReportActionPilot } from "@/components/work-reports/work-report-action-pilot";
import { WorkReportsOverviewCard } from "@/components/work-reports/work-reports-overview-card";
import type { EscalationListResult } from "@/lib/escalations";
import type {
  WorkReportMemberOption,
  WorkReportProjectOption,
  WorkReportView,
} from "@/lib/work-reports/types";

const expectedEndpoints = [
  {
    method: "GET" as const,
    note: "Получить project-scoped список полевых отчётов с review-статусом и metadata.",
    path: "/api/work-reports",
  },
  {
    method: "POST" as const,
    note: "Создать новый полевой отчёт через manual intake или mapped legacy payload.",
    path: "/api/work-reports",
  },
  {
    method: "POST" as const,
    note: "Подтвердить отчёт и зафиксировать reviewer/comment.",
    path: "/api/work-reports/:reportId/approve",
  },
  {
    method: "POST" as const,
    note: "Отклонить отчёт с обязательным review comment.",
    path: "/api/work-reports/:reportId/reject",
  },
  {
    method: "POST" as const,
    note: "Собрать signal packet из полевого отчёта и запустить runs для tasks, risks и status.",
    path: "/api/work-reports/:reportId/signal-packet",
  },
  {
    method: "GET" as const,
    note: "Посмотреть provenance/trace summary для конкретного AI run из signal packet.",
    path: "/api/ai/runs/:runId/trace",
  },
  {
    method: "GET" as const,
    note: "Синхронизировать operator escalation queue поверх work-report signal runs.",
    path: "/api/escalations",
  },
  {
    method: "PATCH" as const,
    note: "Назначить owner или обновить status для escalation item.",
    path: "/api/escalations/:escalationId",
  },
];

export function WorkReportsPage({
  databaseReady,
  escalationQueue,
  members,
  projects,
  reports,
}: {
  databaseReady: boolean;
  escalationQueue: EscalationListResult | null;
  members: WorkReportMemberOption[];
  projects: WorkReportProjectOption[];
  reports: WorkReportView[];
}) {
  const pendingReports = reports.filter((report) => report.status === "submitted").length;
  const approvedReports = reports.filter((report) => report.status === "approved").length;
  const telegramBotReports = reports.filter((report) => report.source === "telegram_bot").length;

  return (
    <div className="grid min-w-0 gap-6">
      <DomainPageHeader
        actions={
          <Link className={buttonVariants({ variant: "outline" })} href="/projects">
            Открыть портфель проектов
          </Link>
        }
        chips={[
          { label: databaseReady ? "Live DB" : "DB required", variant: databaseReady ? "success" : "warning" },
          { label: "Submit/review flow", variant: "info" },
          { label: "Telegram-ready", variant: "success" },
          { label: escalationQueue && escalationQueue.summary.total > 0 ? `${escalationQueue.summary.total} escalation items` : "Escalation queue idle", variant: escalationQueue && escalationQueue.summary.total > 0 ? "warning" : "success" },
        ]}
        description="Раздел уже подключён к живому work-reports backend: можно создавать отчёты, видеть проектную ленту, собирать signal packets и управлять escalation queue по approval-gated или failed AI actions."
        eyebrow="Delivery cadence"
        title="Work Reports"
      />

      <WorkReportsOverviewCard
        approvedReports={approvedReports}
        pendingReports={pendingReports}
        telegramBotReports={telegramBotReports}
        totalReports={reports.length}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <ReportRunsTable reports={reports} />
        <ReportBuilderForm members={members} projects={projects} />
      </div>

      <WorkReportActionPilot reports={reports} />

      {escalationQueue ? (
        <EscalationQueueCard initialQueue={escalationQueue} members={members} />
      ) : null}

      <DomainApiCard
        description="UI уже привязана к реальным backend-контрактам для create/list/review, signal packets, trace inspection и операторской escalation queue."
        endpoints={expectedEndpoints}
        title="Backend Endpoints"
      />
    </div>
  );
}
