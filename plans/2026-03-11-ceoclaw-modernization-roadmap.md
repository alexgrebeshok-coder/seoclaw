# CEOClaw Modernization Roadmap

**Date:** 2026-03-11
**Status:** Active
**Depends on:** `plans/2026-03-11-ceoclaw-master-execution-plan.md`

**Canonical source of current execution truth:** `plans/2026-03-11-ceoclaw-master-execution-plan.md`

This roadmap explains the modernization direction and 30/60/90-day shape. It is not a second live checklist.

## 1. Why This Roadmap Exists

CEOClaw has already crossed the alpha threshold for an AI operating layer. Sessions 01 through 33 are complete on the lead branch, and the product already spans:
- enterprise fact intake;
- evidence and verification;
- proposal and apply;
- outbound delivery;
- operator control;
- knowledge and enterprise truth rollups.

The next 90 days should not add more shallow surfaces. They should turn the current alpha into a pilot-grade operating layer.

The new 90-day target is:

`durable execution -> deeper source truth -> pilot-grade operator control`

## 2. Modernization Thesis

CEOClaw should evolve from a strong alpha into a pilot-grade, evidence-backed operating system for project-driven organizations.

The highest-leverage gaps are now:

1. audit and export packaging is not yet strong enough for pilot review;
2. command-center workload still needs deterministic audit artifacts and handoff surfaces;
3. pilot controls are not yet strong enough for tenant-safe rollout;
4. workspace/environment guardrails still need a clearer live-pilot posture.

## 3. Current Baseline

As of 2026-03-11 the lead branch already has:

1. import and validation pipeline;
2. generalized AI proposal/apply engine;
3. executive brief and alert engine;
4. work report workflow;
5. workspace, membership, and policy model;
6. plan-vs-fact and financial truth layer;
7. meeting-to-action and work-report-to-action vertical slices;
8. live Telegram and SMTP outbound channels;
9. live GPS/GLONASS and 1C read paths;
10. evidence ledger with `reported / observed / verified` states;
11. Video Fact MVP and cross-source confidence fusion;
12. AI trace, provenance, eval coverage, and action safety/compensation;
13. escalation queue, knowledge loop, enterprise truth rollup, normalized GPS telemetry truth, normalized 1C financial truth with deterministic project deltas, persisted reconciliation casefiles for inspectable mismatch reasons, and an executive command center with a shared exception inbox across escalations and reconciliation gaps.

## 4. Gaps Still Open

The following high-value gaps remain open:

1. GPS and 1C are still narrow read domains, not deeper operational truth models.
2. The shared command model exists, but audit/export and pilot controls are not yet strong enough for enterprise rollout.
3. Reconciliation, evidence, and outbound execution still need deterministic audit packaging for pilot review.
4. Tenant-safe rollout guardrails still need to catch up with the richer command and truth layers.

## 5. 30-Day Plan

### Wave 7: Durable Runtime Hardening

#### Session 27: AI Run Persistence and Workflow Ledger

Goal:
- move AI runs, packet state, apply state, and trace metadata from file cache into durable database truth.

Deliver:
- Prisma-backed workflow ledger for runs and traces;
- migration-safe server-run persistence layer;
- compatibility path for existing operator trace views.

Exit criteria:
- process restarts do not lose canonical run state;
- `.ceoclaw-cache` stops being the source of truth for live workflows;
- at least one existing operator workflow reads its run state from durable storage.

Status:
- complete on 2026-03-11 in the lead branch.

#### Session 28: Evidence and Escalation Sync Jobs

Goal:
- remove critical sync-on-read behavior from evidence and escalation derivation.

Deliver:
- explicit sync jobs or outbox-driven derivation for evidence and escalation layers;
- idempotent job boundaries;
- operator-visible sync freshness instead of hidden background work during reads.

Exit criteria:
- `/api/evidence` and `/api/escalations` no longer need to create truth as part of every read;
- derivation failures can be diagnosed without replaying page loads;
- freshness and lag are visible.

Status:
- complete on 2026-03-11 in the lead branch.

#### Session 29: Delivery Ledger and Idempotent Execution

Goal:
- make outbound delivery auditable, retry-safe, and deterministic across Telegram, email, and scheduled sends.

Deliver:
- delivery job ledger;
- idempotency keys and retry posture;
- operator-visible execution history for outbound actions.

Exit criteria:
- repeated sends are controllable and explainable;
- delivery retries stop depending on blind re-execution;
- outbound actions become auditable per run and per target.

Status:
- complete on 2026-03-11 in the lead branch.

## 6. 60-Day Plan

### Wave 8: Source-of-Truth Depth

#### Session 30: GPS Telemetry Domain Expansion

Goal:
- expand GPS from sample snapshots into a richer telemetry truth domain.

Deliver:
- richer session, equipment, and geofence truth;
- narrow but honest telemetry views beyond the current sample card;
- deterministic mappings that other truth layers can reference.

Status:
- complete on 2026-03-12 in the lead branch.

#### Session 31: 1C Financial Truth Deepening

Goal:
- deepen 1C from one finance sample into a more useful project truth source.

Deliver:
- broader project finance slices suitable for reconciliation;
- operator-visible financial truth deltas that can be linked to field evidence;
- no write-back semantics yet.

Status:
- complete on 2026-03-12 in the lead branch.

#### Session 32: Reconciliation Casefile and Fact Linking

Goal:
- create a durable, inspectable reconciliation casefile that links finance, telemetry, work reports, and video evidence.

Deliver:
- casefile model or equivalent linked read layer;
- explainable matching and mismatch reasons;
- one operator surface for unresolved reconciliation gaps.

Status:
- complete on 2026-03-12 in the lead branch.

Exit criteria across Wave 8:

1. GPS and 1C truth become materially deeper than narrow sample reads.
2. Cross-source mismatches are inspectable as cases, not only summary counters.
3. Operators can answer why a project is corroborated, partial, or contradictory.

Wave 8 status:
- complete on 2026-03-12 in the lead branch.

## 7. 90-Day Plan

### Wave 9: Pilot-Grade Operatorization

#### Session 33: Executive Command Center and Exception Inbox

Goal:
- unify operator follow-through around one exception-driven command model.

Deliver:
- shared command center for escalations, truth gaps, and pending follow-through;
- owner-first exception inbox;
- clearer management path from signal to action to closure.

Status:
- complete on 2026-03-12 in the lead branch.

#### Session 34: Audit Pack and Operational Exports

Goal:
- make the system auditable for pilot stakeholders, not only explorable in the UI.

Deliver:
- exportable audit packs for evidence, decisions, traces, and applied changes;
- operator-friendly reporting surfaces for pilot review;
- deterministic export boundaries.

#### Session 35: Pilot Controls and Tenant Readiness

Goal:
- make the product safe to run in real pilots across tenants, workspaces, and environments.

Deliver:
- tenant-safe pilot controls;
- workspace/environment rollout guardrails;
- clearer onboarding and cutover posture for live pilots.

Deliver across the 90-day horizon:
- durable runtime;
- deeper source truth;
- unified operator control;
- auditability and safer pilot rollout.

Wave 9 status:
- in progress on 2026-03-12 in the lead branch through Session 33.
- the next canonical session is Session 34.

## 8. Research Principles Behind This Roadmap

This roadmap follows the most consistent guidance from current agent-system practice:

1. Prefer bounded workflows over premature autonomy.
   Source: Anthropic, "Building effective agents"
   https://www.anthropic.com/engineering/building-effective-agents
2. Treat traces, tools, and evals as product requirements, not afterthoughts.
   Sources:
   - OpenAI Agents guide
     https://platform.openai.com/docs/guides/agents
   - OpenAI Evals design guide
     https://platform.openai.com/docs/guides/evals-design
3. Use durable state and human checkpoints for important workflows.
   Source: LangGraph documentation
   https://langchain-ai.github.io/langgraph/
4. Standardize tool and resource surfaces where possible.
   Source: Model Context Protocol
   https://modelcontextprotocol.io/introduction

## 9. Success Metrics

This modernization is working if:

1. canonical workflow state survives restarts and partial failures;
2. evidence and escalation freshness are visible without deriving truth during every read;
3. GPS and 1C become richer truth domains, not just sample proofs;
4. reconciliation gaps become explicit operator workload;
5. outbound actions are auditable and idempotent;
6. one operator command layer can drive pilot follow-through end to end;
7. audit packs exist for pilot review without manual screenshot assembly.

## 10. What We Still Have Not Done

For planning clarity, the following remain explicitly out of scope or unfinished:

1. full autonomous multi-agent runtime;
2. 1C write-back;
3. full GPS sync engine across all telemetry entities;
4. enterprise-wide reconciliation beyond the chosen wedge domains;
5. generalized tenant platform or marketplace abstractions;
6. arbitrary rollback of downstream side effects beyond bounded compensation guidance.
