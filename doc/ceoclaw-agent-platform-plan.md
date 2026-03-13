# CEOClaw Agent Platform Plan

## Цель

Перестроить CEOClaw из PM dashboard в AI operating layer для проектно-ориентированных предприятий.

Ключевая формула продукта:

`facts -> verification -> agent analysis -> recommendation -> approval -> action`

## Канонический источник истины

Единственный канонический источник текущего execution-state и следующих сессий:

- `plans/2026-03-11-ceoclaw-master-execution-plan.md`

Поддерживающие документы:

- `plans/2026-03-11-ceoclaw-session-operating-model.md` — только правила работы по сессиям;
- `plans/2026-03-11-ceoclaw-modernization-roadmap.md` — только детальный roadmap modernization.

Этот файл нужен как продуктовая рамка и карта происхождения идей, а не как дублирующий live checklist.

## Что уже можно переиспользовать из AI-PMO

### Можно использовать почти напрямую

1. Telegram worklog bot как доменную основу для сбора фактов с участка:
   - модель отчета о работах;
   - роль пользователя;
   - workflow submit -> review -> approve;
   - экспорт и простая админка.

Источник:
- `/Users/aleksandrgrebeshok/CODEBASE/Проекты VScode/claude-workspace/projects/AI-PMO_Severavtodor_Project/03_Agents_Development/telegram_journal_bot/README.md`
- `/Users/aleksandrgrebeshok/CODEBASE/Проекты VScode/claude-workspace/projects/AI-PMO_Severavtodor_Project/03_Agents_Development/telegram_journal_bot/models.py`
- `/Users/aleksandrgrebeshok/CODEBASE/Проекты VScode/claude-workspace/projects/AI-PMO_Severavtodor_Project/03_Agents_Development/telegram_journal_bot/db.py`

2. Python ETL-пайплайн как MVP ingestion layer:
   - автоопределение формата Excel/CSV/TSV;
   - валидация WBS / Budget / Risk / Contract / Worklog;
   - оркестрация импорта по проекту;
   - структура входных и выходных данных по проекту.

Источник:
- `/Users/aleksandrgrebeshok/Desktop/AI_PMO_Real_Data_Testing/scripts/README.md`
- `/Users/aleksandrgrebeshok/Desktop/AI_PMO_Real_Data_Testing/scripts/data_loader.py`
- `/Users/aleksandrgrebeshok/Desktop/AI_PMO_Real_Data_Testing/scripts/validate_data.py`

### Можно использовать как архитектурную спецификацию

1. Модель оркестратора и worker-агентов.
2. GPS/GLONASS как source-of-truth для телеметрии.
3. Video Fact как evidence layer и early-warning layer.
4. EVM на подтвержденных фактах, а не только на ручной отчетности.
5. Принцип `AI рекомендует, человек решает`.

Источник:
- `/Users/aleksandrgrebeshok/Desktop/КСУП_AI-PMO_Северавтодор/08_AI_Документация/AI-01_Концепция_системы_AI-PMO.md`
- `/Users/aleksandrgrebeshok/CODEBASE/Проекты VScode/claude-workspace/projects/AI-PMO_Severavtodor_Project/02_Architecture/System_Architecture.md`
- `/Users/aleksandrgrebeshok/CODEBASE/Проекты VScode/claude-workspace/projects/AI-PMO_Severavtodor_Project/02_Architecture/Integration_Design/GPS_GLONASS_Integration_Spec.md`
- `/Users/aleksandrgrebeshok/CODEBASE/Проекты VScode/claude-workspace/projects/AI-PMO_Severavtodor_Project/02_Architecture/Video_Fact_Module.md`
- `/Users/aleksandrgrebeshok/CODEBASE/Проекты VScode/claude-workspace/projects/AI-PMO_Severavtodor_Project/02_Architecture/Integration_Design/EVM_VideoFact_Integration.md`

### Что не готово к прямому реюзу

1. В AI-PMO почти нет production-ready multi-agent runtime.
2. `run_all_tests.py` сейчас ближе к test orchestrator, чем к реальному execution engine.
3. Большая часть агентной логики оформлена как документация и пайплайны, а не как интегрируемые сервисы.

## Принципы параллельной разработки

1. В одной волне параллельно запускаются только сессии, которые почти не конфликтуют по файлам.
2. Одна волна закрывается перед стартом следующей.
3. Только одна сессия в волне имеет право менять `prisma/schema.prisma`.
4. Только одна сессия в волне имеет право менять `components/dashboard-provider.tsx`.
5. Все новые сущности должны иметь:
   - TypeScript типы;
   - API contracts;
   - happy-path tests;
   - явный demo fallback, если production integration еще не готов.

## Волны работ

Перед всеми волнами ниже есть обязательный `Wave 0`.

### Wave 0: Repo stabilization

Запускать только последовательно.

Цели:

1. Починить build.
2. Привести тесты в предсказуемое состояние.
3. Явно разделить `demo mode` и production behavior.
4. Остановить размытые fallback paths, которые скрывают ошибки.

### Wave 1: Foundation without schema conflicts

Запускать параллельно только после закрытия `Wave 0`.

1. `Session 01` — Import and Validation Pipeline
2. `Session 02` — AI Action Engine Generalization
3. `Session 03` — Executive Brief and Alert Engine

Ожидаемый результат:
- ingestion каркас;
- общий proposal/action engine;
- executive brief и alerts на текущих данных.

### Wave 2: Domain capture and connectors

Запускать после merge Wave 1.

1. `Session 04` — Work Reports Domain Port from AI-PMO
2. `Session 05` — Connector Framework for 1C / GPS / Email / Telegram
3. `Session 06` — UI Shell for Briefs, Imports, Work Reports

Ожидаемый результат:
- work report facts в продукте;
- базовый connector registry;
- UI для новых доменов без ломки существующих страниц.

Текущий статус на 2026-03-11:
- `Session 04` интегрирована в lead branch;
- `Session 05` интегрирована в lead branch;
- `Session 06` интегрирована в lead branch;
- `/imports`, `/briefs`, `/work-reports`, `/integrations` уже привязаны к живым backend-контрактам.

### Wave 3: Core platform model

Запускать после merge Wave 2.

1. `Session 07` — Organization, Workspace, Membership, Policy
2. `Session 08` — Plan-vs-Fact and Financial Truth Layer

Ожидаемый результат:
- role-aware платформа;
- verified facts;
- budget truth;
- отклонения на реальных источниках.

Следующий рекомендованный ход:
1. `Session 07` уже интегрирована в lead branch;
2. `Session 08` уже интегрирована в lead branch;
3. `Session 09` уже интегрирована в lead branch;
4. теперь можно запускать следующий батч поверх meeting-to-action baseline.

### Wave 4: Vertical pilot

Запускать после merge Wave 3.

1. `Session 09` — Meeting-to-Action Vertical Slice
2. `Session 10` — Work Report -> Signal -> Action Loop
3. `Session 11` — First Real Connector Upgrade
4. `Session 12` — Telegram Brief Delivery Channel
5. `Session 13` — Scheduled Executive Digests and Delivery Policies

Текущий статус на 2026-03-11:
- `Session 09` интегрирована в lead branch;
- `Session 10` интегрирована в lead branch;
- `Session 11` интегрирована в lead branch;
- `Session 12` интегрирована в lead branch;
- `Session 13` интегрирована в lead branch;
- `Session 14` интегрирована в lead branch;
- `/meetings` и `/api/meetings/to-action` уже дают pilot flow;
- `/work-reports` и `/api/work-reports/:id/signal-packet` уже дают evidence-to-action flow;
- `/api/connectors` и `/integrations` уже показывают три live connector probe/read slice: Telegram, GPS/GLONASS и 1C;
- `/api/connectors/telegram/briefs` и `/briefs` уже дают outbound delivery flow для executive digests;
- `/api/connectors/telegram/briefs/policies` и cron-safe `run-due` route уже дают scheduled Telegram digest flow;
- `/api/escalations` и `/work-reports` уже дают operator escalation queue с owner, urgency и SLA;
- `/integrations`, `/work-reports` и `/briefs` уже показывают единый runtime truth layer: live, demo, mixed или degraded;
- task / risk / status packets проходят через existing proposal/apply engine.

Фактически этот modernization chain уже закрыт на lead branch:
- `GPS read`
- `evidence ledger`
- `AI trace/evals`
- `1C live read`
- `operator escalation queue`
- `live/demo truth layer`
- `cross-source confidence fusion`
- `action safety and compensation layer`
- `knowledge and benchmark loop`
- `enterprise truth expansion`
- `durable AI run workflow ledger`
- `explicit evidence and escalation sync jobs`
- `durable delivery ledger and idempotent outbound execution`
- `normalized GPS telemetry truth with session/equipment/geofence rollups`
- `normalized 1C financial truth with project deltas and portfolio rollups`
- `persisted reconciliation casefiles with deterministic mismatch reasons across finance, field evidence, and telemetry`
- `executive command center with a shared exception inbox across escalations and reconciliation casefiles`
- `deterministic audit packs for workflow evidence, trace, and applied decision context`
- `explicit pilot controls with tenant/workspace rollout posture and guarded high-risk live workflows`
- `persisted pilot feedback ledger with create/resolve flow linked from command center and audit packs`
- `tenant readiness checklist with explicit cutover blockers, warnings, and drillback links`
- `pilot review scorecards with deterministic weekly governance markdown export`
- `recurring governance review delivery with persisted weekly schedules and governance-scoped ledger entries`
- `durable cutover decision register for approvals, warning waivers, and rollback state`
- `persisted tenant onboarding runbook surface with target-tenant scope, handoff notes, and rollback posture`

Следующий рекомендованный ход:
- keep Sessions 01 through 42 as the locked baseline;
- treat Wave 11 as complete now that the bounded rollout handoff/export layer is in place;
- define Wave 12 from observed post-Wave 11 operator friction instead of assuming a Session 43 upfront.

## Definition of Done по релизу Alpha

1. Можно импортировать проект из табличных данных и документов.
2. Можно собирать факты с участка через work report workflow.
3. Есть executive brief по портфелю и project brief по отдельному проекту.
4. AI не только пишет summary, но и формирует proposal с apply flow.
5. Есть audit trail для proposal/apply.
6. Есть connector abstraction для внешних источников.
7. Есть базовый plan-vs-fact по срокам, задачам, work reports и бюджету.
8. Есть portfolio/project financial truth слой с CPI, SPI, EAC/VAC и signal scoring.
9. Есть первый vertical pilot: `meeting notes -> packet -> proposal -> apply`.
10. Есть второй vertical pilot: `work report -> signal packet -> proposal -> apply`.
11. Есть первый live connector upgrade: Telegram health больше не stub, а реальный Bot API probe.
12. Есть второй live datasource connector upgrade: GPS/GLONASS health больше не stub, а реальный `/session-stats` probe.
13. Есть первый live outbound channel: portfolio/project brief можно preview/send в Telegram.
14. Есть первый scheduled outbound policy layer: executive digests можно сохранять и выполнять по расписанию через cron-safe route.

## Roadmap

Текущий live roadmap больше не дублируется здесь.

Использовать:

- `plans/2026-03-11-ceoclaw-master-execution-plan.md` — что уже сделано и что идёт следующим;
- `plans/2026-03-11-ceoclaw-modernization-roadmap.md` — 30/60/90-day detail.

## Правила merge между волнами

1. После каждой сессии обязательны:
   - короткое summary;
   - список измененных файлов;
   - список тестов;
   - список блокеров.
2. После каждой волны обязательны:
   - smoke test;
   - build check;
   - ручная проверка ключевого сценария.

## Файлы prompt-ов

- `doc/session-prompts/session-01-import-pipeline.md`
- `doc/session-prompts/session-02-ai-action-engine.md`
- `doc/session-prompts/session-03-executive-briefs.md`
- `doc/session-prompts/session-04-work-reports.md`
- `doc/session-prompts/session-05-connectors.md`
- `doc/session-prompts/session-06-ui-shell.md`
- `doc/session-prompts/session-07-org-workspace-policy.md`
- `doc/session-prompts/session-08-plan-vs-fact.md`
- `doc/session-prompts/session-09-meeting-to-action.md`
- `doc/session-prompts/session-10-work-report-signal-loop.md`
- `doc/session-prompts/session-11-live-connector-upgrade.md`
- `doc/session-prompts/session-12-telegram-brief-delivery.md`
- `doc/session-prompts/session-13-scheduled-digests.md`
- `doc/session-prompts/session-14-second-live-datasource-connector.md`
- `doc/session-prompts/session-15-gps-telemetry-ingestion.md`
- `doc/session-prompts/session-16-evidence-ledger.md`
- `doc/session-prompts/session-17-ai-trace-evals.md`
- `doc/session-prompts/session-18-1c-live-read-connector.md`
- `doc/session-prompts/session-19-operator-escalation-queue.md`
- `doc/session-prompts/session-20-live-vs-demo-truth.md`
- `doc/session-prompts/session-21-email-delivery-channel.md`
- `doc/session-prompts/session-22-video-fact-mvp.md`
- `doc/session-prompts/session-23-cross-source-confidence-fusion.md`
- `doc/session-prompts/session-24-action-safety-compensation-layer.md`
- `doc/session-prompts/session-25-knowledge-and-benchmark-loop.md`
- `doc/session-prompts/session-26-enterprise-truth-expansion.md`
- `doc/session-prompts/session-27-ai-run-persistence-ledger.md`
- `doc/session-prompts/session-28-evidence-and-escalation-sync-jobs.md`
- `doc/session-prompts/session-29-delivery-ledger-idempotent-execution.md`
- `doc/session-prompts/session-30-gps-telemetry-domain-expansion.md`
- `doc/session-prompts/session-31-1c-financial-truth-deepening.md`
- `doc/session-prompts/session-32-reconciliation-casefile-fact-linking.md`
- `doc/session-prompts/session-33-executive-command-center-exception-inbox.md`
- `doc/session-prompts/session-34-audit-pack-and-operational-exports.md`
- `doc/session-prompts/session-35-pilot-controls-and-tenant-readiness.md`
- `doc/session-prompts/session-36-pilot-feedback-ledger-resolution-loop.md`
- `doc/session-prompts/session-37-tenant-readiness-cutover-checklist.md`
- `doc/session-prompts/session-38-pilot-review-scorecards-governance-export.md`
