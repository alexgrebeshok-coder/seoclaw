# Session 19: Operator Escalation Queue and SLA Layer

## Goal

Turn work-report signal packets into managed operator workload with explicit ownership, urgency, aging, and SLA visibility.

This session must produce a working end-to-end flow:

`work report signal packet -> persisted AI runs -> escalation sync -> operator queue API -> /work-reports backlog`

## Scope

Work only in the queue slice:

- `lib/escalations/**`
- `app/api/escalations/**`
- `components/work-reports/**`
- `app/work-reports/**`
- the minimal Prisma schema needed for queue persistence
- queue-focused unit coverage only

## Product intent

GPS evidence, 1C finance reads, and AI trace already make the product more trustworthy.

The next trust gain should come from operator control:

1. unresolved AI outputs should become managed backlog, not passive cards;
2. owners, urgency, and SLA should be visible without opening each run;
3. the queue should stay honest about whether work is open, acknowledged, or resolved.

## Requirements

1. Reuse the existing persisted `work_report_signal_packet` run source.
2. Introduce one narrow persistence model for operator queue state.
3. Add queue APIs:
   - `GET /api/escalations`
   - `GET /api/escalations/:id`
   - `PATCH /api/escalations/:id`
4. Support the minimum queue fields:
   - title and summary;
   - project context;
   - purpose and source status;
   - urgency;
   - owner;
   - `open / acknowledged / resolved` queue status;
   - first seen, last seen, SLA target, age.
5. Surface the queue on `/work-reports` in an operator-friendly form.
6. Keep response honesty:
   - empty queue when there are no active source runs;
   - resolved state when source runs disappear or finish;
   - no fake backlog synthesis outside the actual run source.
7. Keep unit coverage focused on sync, owner assignment, and lifecycle transitions.

## Constraints

1. Do not build a generic workflow engine.
2. Do not add a broad enterprise ticketing abstraction.
3. Do not spread queue UI across unrelated pages.
4. Do not invent SLA semantics unrelated to urgency.
5. Prefer one trustworthy operator backlog over a wide but shallow workload module.

## Verification

Minimum verification:

1. `npm run test:unit`
2. `npm run build`
3. Runtime smoke:
   - `POST /api/work-reports/:reportId/signal-packet`
   - `GET /api/escalations`
   - `PATCH /api/escalations/:escalationId`
   - `GET /work-reports`

## Done when

This session is done when operators can see unresolved signal work as an owned queue with SLA context, update that queue through API and UI, and the product remains explicit about what is still open versus merely observed.
