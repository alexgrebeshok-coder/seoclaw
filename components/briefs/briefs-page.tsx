import Link from "next/link";

import { BriefQueueTable } from "@/components/briefs/brief-queue-table";
import { BriefRequestForm } from "@/components/briefs/brief-request-form";
import { BriefsOverviewCard } from "@/components/briefs/briefs-overview-card";
import { DomainApiCard } from "@/components/layout/domain-api-card";
import { DomainPageHeader } from "@/components/layout/domain-page-header";
import { OperatorRuntimeCard } from "@/components/layout/operator-runtime-card";
import { buttonVariants } from "@/components/ui/button";
import type { PortfolioBrief, ProjectBrief } from "@/lib/briefs/types";
import {
  getOperatorTruthBadge,
  type OperatorRuntimeTruth,
} from "@/lib/server/runtime-truth";

const expectedEndpoints = [
  {
    method: "GET" as const,
    note: "Получить portfolio brief с headline, sections, formats и top alerts.",
    path: "/api/briefs/portfolio?locale=ru",
  },
  {
    method: "GET" as const,
    note: "Получить project brief для конкретного проекта с recommendations и форматами доставки.",
    path: "/api/briefs/project/:projectId?locale=ru",
  },
  {
    method: "GET" as const,
    note: "Получить prioritized alerts feed, на котором строится executive review.",
    path: "/api/alerts/prioritized?limit=5&locale=ru",
  },
  {
    method: "POST" as const,
    note: "Preview или отправка executive brief в Telegram через live connector.",
    path: "/api/connectors/telegram/briefs",
  },
  {
    method: "POST" as const,
    note: "Preview или отправка executive brief по email через live SMTP connector.",
    path: "/api/connectors/email/briefs",
  },
  {
    method: "GET" as const,
    note: "Получить сохранённые scheduled delivery policies для Telegram digests.",
    path: "/api/connectors/telegram/briefs/policies",
  },
  {
    method: "POST" as const,
    note: "Запустить due scheduled digests через cron-safe endpoint.",
    path: "/api/connectors/telegram/briefs/policies/run-due",
  },
];

export function BriefsPage({
  portfolioBrief,
  projectBriefs,
  projectOptions,
  runtimeTruth,
}: {
  portfolioBrief: PortfolioBrief;
  projectBriefs: ProjectBrief[];
  projectOptions: Array<{ id: string; name: string }>;
  runtimeTruth: OperatorRuntimeTruth;
}) {
  const leadProjectBrief = projectBriefs[0] ?? null;
  const runtimeBadge = getOperatorTruthBadge(runtimeTruth);

  return (
    <div className="grid gap-6">
      <DomainPageHeader
        actions={
          <Link className={buttonVariants({ variant: "outline" })} href="/analytics">
            Cross-check portfolio signals
          </Link>
        }
        chips={[
          { label: runtimeBadge.label, variant: runtimeBadge.variant },
          { label: `${portfolioBrief.topAlerts.length} top alerts`, variant: portfolioBrief.topAlerts.length > 0 ? "warning" : "success" },
          { label: "ru/en formats", variant: "info" },
          { label: "Telegram delivery", variant: "info" },
          { label: "Email delivery", variant: "info" },
          { label: "Scheduled digests", variant: "info" },
        ]}
        description="Страница executive briefs уже опирается на реальный brief engine: портфельный summary, project-level briefs и delivery formats для Telegram и email без внешнего AI."
        eyebrow="Executive comms"
        title="Executive Briefs"
      />

      <OperatorRuntimeCard truth={runtimeTruth} />

      <BriefsOverviewCard portfolioBrief={portfolioBrief} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <BriefQueueTable portfolioBrief={portfolioBrief} projectBriefs={projectBriefs} />
        <BriefRequestForm
          portfolioBrief={portfolioBrief}
          projectBrief={leadProjectBrief}
          projectOptions={projectOptions}
        />
      </div>

      <DomainApiCard
        description="UI теперь соответствует реальным brief и alert endpoints, а не вымышленной queue/publish модели."
        endpoints={expectedEndpoints}
        title="Backend Endpoints"
      />
    </div>
  );
}
