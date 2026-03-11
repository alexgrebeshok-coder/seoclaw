# CEOClaw Master Execution Plan

**Date:** 2026-03-11
**Status:** Active
**Supersedes:** none

## Execution Status Snapshot

As of 2026-03-11:
- Wave 0 core stabilization is complete.
- Session 01 import and validation pipeline is complete in the lead branch.
- Session 02 AI action engine generalization is complete in the lead branch.
- Session 03 executive brief and alert engine is complete in the lead branch.
- Session 04 work reports domain port is complete in the lead branch.
- Session 05 connector framework is complete and integrated in the lead branch.
- Session 06 UI shell is complete and integrated against live imports, briefs, work reports, and connector APIs.
- Session 07 organization, workspace, membership, and policy foundation is complete in the lead branch.
- Session 08 plan-vs-fact and financial truth layer is complete in the lead branch.
- Session 09 meeting-to-action vertical slice is complete in the lead branch.
- Session 10 work report signal-to-action loop is complete in the lead branch.
- Session 11 first live connector upgrade is complete in the lead branch.
- Session 12 Telegram brief delivery channel is complete in the lead branch.
- Session 13 scheduled executive digests and delivery policies is complete in the lead branch.
- Session 14 second live datasource connector upgrade is complete in the lead branch.
- Session 15 GPS read-only telemetry ingestion is complete in the lead branch.
- Session 16 evidence ledger and verification status is complete in the lead branch.
- Session 17 AI trace, provenance, and eval harness is complete in the lead branch.
- Session 18 1C live read connector is complete in the lead branch.
- Session 19 operator escalation queue and SLA layer is complete in the lead branch.
- Session 20 live-vs-demo truth in operator UX is complete in the lead branch.
- Session 21 outbound email delivery channel is complete in the lead branch.
- Wave 1 foundation services are complete. Wave 2 fact capture and connector shell is complete. Wave 3 platform access model is complete through Session 08. Wave 4 vertical pilot now has Session 09, Session 10, Session 11, Session 12, Session 13, and Session 14 complete.
- Wave 5 evidence and runtime modernization is complete on the lead branch.
- Wave 6 integration truth expansion is complete on the lead branch through Session 21, with Session 22 next.

## 1. Product Direction

CEOClaw is not being developed as another PM dashboard.

Target form:

`enterprise facts -> verification -> agent analysis -> recommendation -> approval -> action -> trace`

North star:

`CEOClaw knows what is actually happening in the project or enterprise and helps management act in time.`

## 2. What We Are Building

### Core product

An AI operating layer for project-driven organizations:
- construction;
- infrastructure;
- logistics;
- industrial and operational projects;
- PMO-driven enterprises.

### Core promise

The system should:
- connect to enterprise facts;
- detect deviations between plan and reality;
- generate executive-grade signals;
- propose actions safely;
- apply approved changes to plans, tasks, risks, and communications.

### Product wedge

The first commercial wedge should be:
- construction and infrastructure first;
- logistics second;
- broader project-heavy enterprises later.

## 3. Reuse Strategy

### Reuse directly

1. AI-PMO Telegram work report workflow:
   - daily field reports;
   - reporter and admin roles;
   - submit, review, approve cycle;
   - CSV export;
   - attachment metadata shape.

2. AI-PMO real-data testing pipeline:
   - file import patterns;
   - validation logic;
   - project-level ingestion structure;
   - normalized data outputs.

### Reuse as specification

1. Agent roles and separation of responsibility.
2. GPS and telemetry as source-of-truth connectors.
3. Video Fact as evidence and early-warning layer.
4. EVM and financial truth on confirmed facts.
5. Principle: `AI recommends, human decides`.

### Do not reuse blindly

1. Claude AI-PMO repo is mostly documentation and design artifacts.
2. There is no finished production agent runtime to transplant.
3. We should port concepts and domain models, not cargo-cult the old architecture.

## 4. Delivery Model

### Recommended model

Use a hybrid model:
- I act as lead integrator and system designer.
- Parallel worker sessions are used only for isolated file zones.
- After each wave, one integration pass merges results into a coherent product.

This is better than:
- full sequential work only, because it is slower than necessary;
- uncontrolled parallel work, because the current wave still crosses telemetry, evidence, AI runtime, and operator surfaces.

## 5. Wave Plan

## Wave 0: Stabilize the Current Repo

**Mode:** Sequential only
**Owner:** Lead session only
**Reason:** The repo currently has broken build/test behavior.

### Goals

1. Build must complete reliably.
2. Unit tests must be real unit tests or be clearly split from integration tests.
3. Demo mode and production mode must be explicit.
4. Current API behavior must stop hiding failures behind broad mock fallbacks.

### Exit criteria

1. `npm run build` passes.
2. `npm run test:unit` is deterministic.
3. There is a written stability baseline.
4. Parallel workers can operate without debugging repo-wide failures first.

## Wave 1: Foundation Services

**Mode:** Parallel allowed
**Max parallel sessions:** 3

### Sessions

1. Session 01: Import and Validation Pipeline
   Status: complete on lead branch.
2. Session 02: AI Action Engine Generalization
   Status: complete on lead branch.
3. Session 03: Executive Brief and Alert Engine
   Status: complete on lead branch.

### Outcome

1. Data can be ingested in a normalized way.
   Current state: import validation and preview APIs exist for WBS, Budget Plan, Risk Register, Payment History, Worklog Summary, and Main Contract placeholder.
2. The AI layer can generate more than one action type.
   Current state: create_tasks, update_tasks, reschedule_tasks, raise_risks, draft_status_report, and notify_team now flow through the shared proposal/apply engine.
3. Executive briefs and alerts exist as first-class outputs.
   Current state: portfolio brief, project brief, and prioritized alerts APIs exist with localized `ru/en` output.

## Wave 2: Fact Capture and Connector Skeleton

**Mode:** Parallel allowed
**Max parallel sessions:** 3

### Sessions

1. Session 04: Work Reports Domain Port
   Status: complete on lead branch.
2. Session 05: Connector Framework
   Status: complete and integrated on lead branch.
3. Session 06: UI Shell for New Domains
   Status: complete and integrated on lead branch.

### Outcome

1. Field facts enter the product.
   Current state: `WorkReport` Prisma model, CRUD API, approve/reject flow, AI-PMO Telegram bot mapper, and smoke-tested project-scoped retrieval exist on the lead branch.
2. Connector registry and health model exist.
   Current state: `/api/connectors`, `/api/connectors/:id`, `/api/health`, adapters for Telegram, email, GPS, and 1C, plus registry-backed integrations UI exist on the lead branch.
3. New surfaces exist for imports, briefs, work reports, and integrations.
   Current state: `/imports`, `/briefs`, `/work-reports`, and `/integrations` are wired to live backend contracts instead of placeholder endpoints.

## Wave 3: Platform Access Model

**Mode:** Sequential preferred
**Max parallel sessions:** 1-2

### Sessions

1. Session 07: Organization, Workspace, Membership, Policy
   Status: complete and integrated on lead branch.
2. Session 08: Plan-vs-Fact and Financial Truth Layer
   Status: complete and integrated on lead branch.

### Rule

Session 07 should land before heavy rollout of session 08 because workspace, visibility, and policy will affect how plan-vs-fact results are exposed.

### Outcome

1. Workspace becomes real.
   Current state: workspace selection is now role-gated through the policy catalog instead of a decorative local preference list.
2. Visibility and permissions become enforceable.
   Current state: live policy checks protect briefs, connectors, imports, work reports, and the due-date cron route.
3. Plan-vs-fact and financial truth move closer to enterprise-grade behavior.
   Current state: portfolio/project plan-vs-fact summaries, EVM metrics, work-report evidence, and analytics/brief integration are live on the lead branch.

## Wave 4: Vertical Pilot

**Mode:** Sequential integration + selective parallel bugfixing

### Sessions

1. Session 09: Meeting-to-Action Vertical Slice
   Status: complete and integrated on lead branch.
2. Session 10: Work Report -> Signal -> Action Loop
   Status: complete and integrated on lead branch.
3. Session 11: First Real Connector Upgrade
   Status: complete and integrated on lead branch.
4. Session 12: Telegram Brief Delivery Channel
   Status: complete and integrated on lead branch.
5. Session 13: Scheduled Executive Digests and Delivery Policies
   Status: complete and integrated on lead branch.
6. Session 14: Second Live Datasource Connector Upgrade
   Status: complete and integrated on lead branch.

### Goals

1. Construction-first pilot scenario.
2. Meeting-to-action flow.
3. Daily executive brief.
4. Work report to signal to action loop.
5. One connector upgraded from stub to real integration.
6. A second datasource connector upgraded from stub to an honest live probe.

### Outcome

An actual pilotable alpha, not just a feature collection.

Current state:

1. `/meetings` provides a working intake UI for project-scoped meeting notes.
2. `/api/meetings/to-action` launches a packet of AI runs on one project context.
3. Tasks, risks, and status draft proposals can be reviewed and applied through the existing AI proposal engine.
4. `/work-reports` now provides a work report signal packet pilot with live packet creation, run polling, and proposal apply.
5. `/api/connectors` now exposes real Telegram, GPS, and 1C live probes instead of pure stubs.
6. `/integrations` now shows three live connectors and one remaining stub.
7. Runtime health now surfaces token, webhook, and GPS probe problems honestly; on the current machine Telegram resolves as `degraded` because Bot API returns `HTTP 404` on `getMe`, while GPS resolves as `ok` against the configured `/session-stats` probe.
8. `/api/connectors/telegram/briefs` now supports dry-run preview and outbound Telegram delivery for portfolio or project briefs.
9. `/briefs` now exposes a Telegram delivery panel with preview/send flow on top of the live brief generator.
10. `/api/connectors/telegram/briefs/policies` now persists scheduled Telegram digest policies with locale, cadence, timezone, target chat, and last delivery state.
11. `/api/connectors/telegram/briefs/policies/run-due` now executes due policies through the existing cron-safe auth pattern.
12. `/briefs` now exposes a scheduled digest operator panel with save, pause, and resume controls.

## Wave 5: Evidence and Runtime Modernization

**Mode:** Lead-first sequential delivery with selective parallel implementation only when file zones are isolated

### Sessions

1. Session 15: GPS Read-Only Telemetry Ingestion
   Status: complete on lead branch.
2. Session 16: Evidence Ledger and Verification Status
   Status: complete on lead branch.
3. Session 17: AI Trace, Provenance, and Eval Harness
   Status: complete on lead branch.

### Goals

1. Move from connector health to connector truth.
2. Distinguish reported facts from observed and verified evidence.
3. Make at least one AI operating loop inspectable and regression-testable.

### Outcome

This wave turned the current alpha from:

`facts -> recommendation -> approval`

into:

`facts -> evidence -> verification -> recommendation -> approval -> trace`

### Current state

1. GPS now has a live sample read path, not only a readiness probe.
2. Evidence is now surfaced with `reported / observed / verified` states.
3. One AI operating loop now exposes a trace route, provenance panel, and repeatable eval coverage.

## Wave 6: Integration Truth Expansion

**Mode:** Lead-first sequencing with worker help only for isolated UI or route zones

### Sessions

1. Session 18: 1C Live Read Connector
   Status: complete on lead branch.
2. Session 19: Operator Escalation Queue and SLA Layer
   Status: complete on lead branch.
3. Session 20: Live-vs-Demo Truth in Operator UX
   Status: complete on lead branch.

### Goals

1. Extend enterprise truth beyond GPS and work reports.
2. Turn signals into managed operator workload.
3. Remove ambiguity between live and simulated product states.

### Current state

1. 1C now has a live project finance sample read path, not only a stub descriptor.
2. `/api/connectors/one-c/sample` exposes normalized project finance records for operators.
3. `/integrations` now shows a live 1C finance sample alongside GPS telemetry evidence.
4. `/api/escalations` and `/api/escalations/:id` now turn work-report signal runs into operator-managed queue items.
5. `/work-reports` now surfaces owner assignment, acknowledgment state, urgency, aging, and SLA context for unresolved signal items.
6. `/integrations`, `/work-reports`, and `/briefs` now surface a shared runtime truth card with live, demo, mixed, or degraded state.
7. Demo mode now blocks live delivery workflows and keeps `/work-reports` plus `/api/escalations` in a safe preview posture.

### 30/60/90-day direction

The detailed roadmap for post-alpha modernization is tracked in:

- `plans/2026-03-11-ceoclaw-modernization-roadmap.md`

## 6. Technical Tracks

### Track A: Stability and Platform

Includes:
- build;
- test hygiene;
- schema changes;
- auth and policy;
- production mode;
- error handling;
- audit.

### Track B: Fact Layer

Includes:
- imports;
- work reports;
- connectors;
- normalization;
- validation.

### Track C: Agent Layer

Includes:
- proposals;
- apply flow;
- alerts;
- briefs;
- recommendation payloads.

### Track D: Product Surface

Includes:
- routes;
- dashboards;
- operational views;
- integration status views;
- role-based interfaces.

### Track E: Evidence and Runtime Modernization

Includes:
- telemetry reads;
- evidence ledger;
- verification state;
- AI traces;
- provenance;
- eval harnesses.

## 7. Architecture Milestones

### Milestone A

`repo stable + explicit demo mode + testable import service`

### Milestone B

`facts can enter + briefs can be generated + actions can be proposed`

### Milestone C

`field reports + connector framework + new operating UI`

### Milestone D

`workspace-aware platform + plan-vs-fact + financial signals`

### Milestone E

`vertical pilot with one real integration and one daily operating loop`

### Milestone F

`verified telemetry facts + evidence status + traceable agent runs`

## 8. Rules for Parallel Sessions

1. Never run parallel sessions before Wave 0 is closed.
2. Never let more than one session edit `prisma/schema.prisma` in the same wave.
3. Never let more than one session rewrite the same API subtree.
4. Each session works only inside its allowed file list.
5. Every session must return:
   - changed files;
   - tests run;
   - blockers;
   - assumptions;
   - what the integration session must do next.

## 9. Recommended Working Agreement

### My role

I should remain the coordinating session:
- define wave order;
- adjust prompts when repo reality changes;
- integrate and verify;
- handle cross-cutting refactors;
- decide when parallel work is safe.

### Your role

You decide how much concurrency to fund with attention and time:
- one session if you want low-risk steady progress;
- three sessions if you want faster throughput after Wave 0.

### Worker session role

A worker session should:
- receive exactly one prompt file;
- touch only allowed files;
- avoid opportunistic refactors;
- stop at domain boundary instead of leaking into another track.

## 10. Practical Recommendation

### Best option right now

1. Keep this session on the lead integration track for Wave 6.
2. Land Session 22 next to add the first visual evidence loop.
3. Reassess Session 23 only after visual evidence semantics are coherent.

### Why this is best

Because the product already has enough surface area for an alpha. The next meaningful gain is operational trust:

- trustworthy evidence;
- trustworthy provenance;
- trustworthy enterprise reads;
- trustworthy operator control.

That is more valuable now than broadening the UI or adding another shallow connector.

## 11. Immediate Next Actions

1. Keep Wave 0 closed and stable; it is no longer the active bottleneck.
2. Land Session 22:
   - first visual evidence ingestion path;
   - one operator-facing evidence summary;
   - one verification rule tied to existing signals.
3. Reassess Session 23 through Session 25 after the post-Wave-6 baseline is stable.

## 12. Definition of Alpha

Alpha is reached when:
- imports work;
- work reports work;
- executive brief works;
- AI proposals can be approved and applied;
- connector registry exists;
- workspace and policy are real;
- plan-vs-fact exists;
- one vertical pilot scenario can be demonstrated end to end.

Current status:
- this alpha threshold is already met on the lead branch;
- the active target is now post-alpha modernization, not alpha assembly.
