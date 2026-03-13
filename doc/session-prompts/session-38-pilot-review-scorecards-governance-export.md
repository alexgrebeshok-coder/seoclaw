# Session 38: Pilot Review Scorecards and Governance Export

## Goal

Turn pilot operations into one recurring review artifact instead of page-by-page manual inspection.

This session must produce a working end-to-end flow:

`pilot feedback + exception backlog + delivery and freshness signals -> scorecard -> governance export`

## Scope

Work only in the pilot-review slice:

- selected routes under `app/api/**`
- selected operator surfaces under `components/**`
- narrow scorecard/export helpers under `lib/**`
- focused planning-copy updates where review posture would otherwise be overstated
- focused unit coverage only

## Product intent

The product already has command-center backlog, audit packs, delivery ledger, sync freshness, and pilot controls.

What is missing is a recurring management review surface that combines those signals into one deterministic scorecard.

This slice must stay honest:

- no generic BI platform;
- one narrow review scorecard first;
- deterministic pilot review over exploratory analytics sprawl.

## Requirements

1. Add one pilot-review scorecard over at least three existing operational layers.
2. Include signals such as backlog aging, freshness lag, blocked workflows, delivery health, or open pilot feedback.
3. Expose one deterministic export suitable for recurring governance or steering review.
4. Keep one operator-facing entry point for reading and exporting the scorecard.
5. Reuse existing audit/export patterns where possible.

## Constraints

1. Do not build a general reporting subsystem.
2. Do not add arbitrary query-builder behavior.
3. Keep the scorecard explainable and deterministic.
4. Reuse existing truth, ledger, and export boundaries.

## Verification

Minimum verification:

1. `npm run test:unit`
2. `npm run build`
3. Runtime smoke:
   - generate one pilot-review scorecard
   - inspect or download one governance export

## Done when

This session is done when a weekly pilot review can be run from one scorecard and one export artifact instead of manually collecting multiple pages and screenshots.
