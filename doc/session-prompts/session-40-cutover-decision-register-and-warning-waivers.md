# Session 40: Cutover Decision Register and Warning Waivers

## Goal

Make cutover approvals, accepted warnings, and reversals durable instead of implicit.

This session must produce a working end-to-end flow:

`tenant readiness / pilot review outcome -> explicit cutover decision or accepted warning -> durable register -> drillback history`

## Scope

Work only in the decision-register slice:

- selected routes under `app/api/**`
- selected operator surfaces under `components/**`
- narrow decision/register helpers under `lib/**`
- focused planning-copy updates where approval state would otherwise be overstated
- focused unit coverage only

## Product intent

The product already has tenant readiness, pilot review scorecards, recurring governance delivery, pilot controls, and persisted operator ledgers.

What is missing is one durable place where operators can record:

- a cutover approval;
- an accepted warning or waiver;
- a reversal or rollback of that decision.

This slice must stay honest:

- no broad approval workflow engine;
- no generic policy registry;
- one narrow cutover decision register first.

## Requirements

1. Add one operator-visible way to record a cutover decision or warning waiver.
2. Tie the decision explicitly to readiness and/or pilot review context.
3. Persist the decision with timestamps and actor metadata.
4. Expose one operator-facing entry point for inspecting the latest accepted warning or cutover decision.
5. Keep the state explainable enough for future tenant widening and rollback discussions.

## Constraints

1. Do not build a generic approvals platform.
2. Do not widen into tenant provisioning or rollout automation yet.
3. Reuse existing readiness/review boundaries where possible.
4. Keep the register bounded to pilot cutover governance.

## Verification

Minimum verification:

1. `npm run test:unit`
2. `npm run build`
3. Runtime smoke:
   - create one cutover decision or accepted warning entry
   - verify it renders in the intended operator surface
   - verify the persisted record is visible through the intended API boundary

## Done when

This session is done when cutover approval and accepted-warning state stops living in operator memory and becomes a durable in-product governance record.
