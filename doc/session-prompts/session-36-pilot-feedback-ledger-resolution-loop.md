# Session 36: Pilot Feedback Ledger and Resolution Loop

## Goal

Make pilot feedback durable, inspectable, and linked to real workflow evidence instead of leaving it in off-platform chat.

This session must produce a working end-to-end flow:

`exception or audit artifact -> feedback item -> owner response -> resolved state`

## Scope

Work only in the pilot-feedback slice:

- selected routes under `app/api/**`
- selected operator surfaces under `components/**`
- narrow supporting models and services under `lib/**`
- narrow planning-copy updates where the product would otherwise overstate pilot feedback closure
- focused unit coverage only

## Product intent

The product already has command-center exceptions, audit packs, and pilot controls.

What is missing is a durable feedback loop that turns pilot comments into managed product truth.

This slice must stay honest:

- no generic ticketing platform;
- one narrow feedback ledger first;
- evidence-linked follow-through over loose commentary.

## Requirements

1. Add one durable pilot-feedback ledger or equivalent persisted model.
2. Link feedback to at least one real workflow artifact such as an exception item, audit pack, run, or reconciliation casefile.
3. Surface status, owner, timestamps, and next action clearly.
4. Keep drillback to the source workflow or evidence surface.
5. Expose one operator-facing entry point for creating and resolving feedback.

## Constraints

1. Do not build a broad issue tracker.
2. Do not add collaboration features unrelated to pilot follow-through.
3. Keep feedback explicit and evidence-linked.
4. Reuse existing command-center and audit-pack surfaces where possible.

## Verification

Minimum verification:

1. `npm run test:unit`
2. `npm run build`
3. Runtime smoke:
   - create one pilot-feedback item against a real workflow artifact
   - resolve that feedback item through the intended operator path

## Done when

This session is done when a pilot stakeholder can record feedback against real workflow evidence and the operator can track and close that feedback inside the product.
