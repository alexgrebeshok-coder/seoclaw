# Session 39: Governance Review Scheduling and Delivery

## Goal

Turn pilot review from an on-demand export into a recurring governance delivery loop.

This session must produce a working end-to-end flow:

`pilot review scorecard -> delivery policy or schedule -> deterministic export dispatch -> delivery ledger`

## Scope

Work only in the governance-delivery slice:

- selected routes under `app/api/**`
- selected operator surfaces under `components/**`
- narrow scheduling/export helpers under `lib/**`
- focused planning-copy updates where recurring review cadence would otherwise be overstated
- focused unit coverage only

## Product intent

The product already has pilot review scorecards, deterministic markdown export, scheduled brief policies, and a durable delivery ledger.

What is missing is a recurring governance path that can deliver the same pilot review artifact without manual page opens and ad-hoc downloads.

This slice must stay honest:

- no broad workflow engine;
- one narrow recurring governance delivery loop first;
- reuse existing scorecard, export, and outbound delivery boundaries.

## Requirements

1. Add one operator-visible way to schedule or trigger recurring pilot-review delivery.
2. Reuse the existing pilot-review scorecard and deterministic export as the payload source.
3. Route execution through an auditable delivery path or equivalent persisted execution boundary.
4. Keep the cadence explainable, narrow, and bounded to governance review use cases.
5. Expose one operator-facing entry point for inspecting the schedule and the latest run outcome.

## Constraints

1. Do not build a generic workflow scheduler.
2. Do not introduce office-document generation or BI/report-builder behavior.
3. Keep delivery deterministic and idempotent.
4. Reuse existing scheduled-delivery, policy, and ledger helpers where possible.

## Verification

Minimum verification:

1. `npm run test:unit`
2. `npm run build`
3. Runtime smoke:
   - create or load one governance delivery schedule/policy
   - run one review delivery
   - verify the run appears in the intended execution history or delivery ledger

## Done when

This session is done when a weekly or steering pilot review can be delivered from one explicit in-product schedule/trigger instead of manual scorecard export steps.
