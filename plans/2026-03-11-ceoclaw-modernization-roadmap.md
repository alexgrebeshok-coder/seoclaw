# CEOClaw Modernization Roadmap

**Date:** 2026-03-11
**Status:** Active
**Depends on:** `plans/2026-03-11-ceoclaw-master-execution-plan.md`

**Canonical source of current execution truth:** `plans/2026-03-11-ceoclaw-master-execution-plan.md`

This roadmap explains the modernization direction and 30/60/90-day shape. It is not a second live checklist.

## 1. Why This Roadmap Exists

CEOClaw has already crossed the alpha threshold for an AI operating layer:
- facts can enter the product;
- AI can generate proposals;
- humans can review and apply changes;
- executive briefs and alerts exist;
- Telegram, GPS/GLONASS, and 1C are no longer pure stubs.

The next stage should not be "more surfaces." It should be:

`reported facts -> observed evidence -> verified truth -> agent analysis -> recommendation -> approval -> action -> trace -> learning`

That is the modernization target for the next 90 days.

## 2. Modernization Thesis

CEOClaw should evolve from a dashboard-shaped alpha into an evidence-backed operating system for project-driven organizations.

The strongest gap versus the original AI-PMO vision is not UI breadth. It is:

1. too little verified operational truth;
2. too little runtime traceability and evaluation;
3. too little cross-system confidence fusion.

## 3. Current Baseline

As of 2026-03-11 the lead branch already has:

1. import and validation pipeline;
2. generalized AI proposal/apply engine;
3. executive brief and alert engine;
4. work report workflow;
5. workspace, membership, and policy model;
6. plan-vs-fact and financial truth layer;
7. meeting-to-action and work-report-to-action vertical slices;
8. live Telegram probe and Telegram digest delivery;
9. live GPS/GLONASS readiness probe;
10. GPS read-only telemetry sample path;
11. evidence ledger with `reported / observed / verified` states;
12. AI trace, provenance, and eval coverage for one live operator workflow;
13. 1C live read-only finance sample path.

## 4. Gaps Still Open

The following high-value gaps remain open:

1. Email remains a stub outbound channel.
2. Demo mode versus live mode is not surfaced consistently across operator views.
3. Video Fact and cross-source verification have not been ported from AI-PMO ideas into product reality.
4. Action safety stops at approval; there is no compensation or rollback model yet.
5. The current evidence layer is intentionally narrow and still needs multi-source fusion.
6. 1C currently exposes one narrow finance slice, not broader enterprise truth coverage.
7. Live-vs-demo truth is still not surfaced consistently in operator-facing UX.

## 5. 30-Day Plan

The first modernization foundation is already landed on the lead branch:

1. Session 15: GPS read-only telemetry ingestion.
2. Session 16: evidence ledger and verification status.
3. Session 17: AI trace, provenance, and eval harness.
4. Session 18: 1C live read connector.
5. Session 19: operator escalation queue and SLA layer.
6. Session 20: live-vs-demo truth in operator UX.

That changes the active next 30-day plan to the next truth-expansion wave.

### Session 19: Operator Escalation Queue and SLA Layer

Goal:
- convert signals into a managed queue with owner, urgency, and aging.

Deliver:
- escalation queue;
- owner assignment and aging fields;
- SLA-oriented operator view for unresolved signals and proposals.

Exit criteria:
- unresolved signals become managed workload instead of passive lists;
- aging and urgency are visible without opening each item;
- operator follow-through becomes measurable.

Status:
- complete on 2026-03-11 in the lead branch.

### Session 20: Live-vs-Demo Truth in Operator UX

Goal:
- remove ambiguity about what is simulated versus what is sourced from real systems.

Deliver:
- consistent demo/live badges and messaging;
- source provenance labels across key pages;
- runtime truth surfaced in the main operator workflows.

Exit criteria:
- non-technical operators can tell live from simulated states without guessing;
- demo-safe screens and live-truth screens stop contradicting each other;
- the product is safer to pilot in mixed environments.

Status:
- complete on 2026-03-11 in the lead branch.

## 6. 60-Day Plan

### Session 21: Email Delivery Channel

Goal:
- create the second real outbound channel after Telegram.

Deliver:
- live email probe and delivery path;
- operator-visible send target and delivery status;
- policy-safe outbound behavior consistent with the Telegram brief model.

Status:
- complete on 2026-03-11 in the lead branch.

### Session 22: Video Fact MVP

Goal:
- port the smallest useful visual evidence loop from AI-PMO into CEOClaw.

Deliver:
- one visual evidence ingestion path;
- one operator-facing evidence summary;
- one narrow verification rule linking visual fact to existing signals.

### Session 23: Cross-Source Confidence Fusion

Goal:
- combine work reports, GPS, and future evidence streams into one confidence model.

Deliver:
- confidence merge rules for at least two independent sources;
- visible provenance and confidence rollup;
- one UI/API surface showing why a fact is treated as verified or not.

## 7. 90-Day Plan

### Session 24: Action Safety and Compensation Layer

Goal:
- add explicit safety boundaries for applied actions beyond manual approval.

### Session 25: Knowledge and Benchmark Loop

Goal:
- turn repeated operating patterns into reusable playbooks, lessons, and benchmark-guided recommendations.

### Session 26: Enterprise Truth Expansion

Goal:
- extend the evidence-backed model beyond the pilot sources into broader enterprise systems without collapsing the product into a generic integration hub.

Deliver across the 90-day horizon:
- outbound redundancy;
- evidence fusion;
- stronger operational truth;
- safer execution;
- reusable operator knowledge.

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

1. connector health is no longer the primary integration signal;
2. operators can inspect evidence and provenance for key facts;
3. at least one AI workflow is traceable, queue-backed, and regression-tested;
4. live versus demo state is obvious to non-technical users;
5. external truth sources start to outrank manually reported facts when confidence is higher;
6. the next active sessions can be chosen from the master plan without contradicting this roadmap;
7. 1C no longer appears as a permanent stub in operator-facing connector views;
8. unresolved signal packets now become owned operator workload with SLA context.

## 10. What We Still Have Not Done

For planning clarity, the following remain explicitly out of scope or unfinished:

1. full GPS sync engine;
2. 1C write-back;
3. real outbound email;
4. Video Fact production module;
5. cross-source confidence fusion;
6. enterprise-wide knowledge or benchmark loop;
7. compensation or rollback model for applied changes;
8. full enterprise-scale multi-source verification beyond the current narrow evidence slice.
