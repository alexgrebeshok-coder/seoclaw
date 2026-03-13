# Session 41: Tenant Onboarding Runbook and Rollout Templates

## Goal

Make the next tenant rollout repeatable without building a broad tenant control plane.

This session must produce a working end-to-end flow:

`tenant readiness + pilot review + cutover decisions -> onboarding/runbook template -> repeatable rollout preparation surface`

## Scope

Work only in the rollout-preparation slice:

- selected routes under `app/api/**`
- selected operator surfaces under `components/**`
- narrow rollout/runbook helpers under `lib/**`
- focused planning-copy updates where onboarding state would otherwise be overstated
- focused unit coverage only

## Product intent

The product already has tenant readiness, pilot review scorecards, recurring governance delivery, and a durable cutover decision register.

What is missing is one explicit surface that helps operators prepare the next tenant rollout without relying on memory or reopening a broad admin rewrite.

This slice must stay honest:

- no tenant provisioning control plane;
- no broad workspace/bootstrap generator;
- one narrow onboarding runbook/template surface first.

## Requirements

1. Add one operator-visible way to inspect or prepare the next tenant rollout.
2. Reuse existing readiness, review, and cutover decision boundaries as input.
3. Make the runbook/template durable enough to repeat the rollout conversation for the next tenant.
4. Expose one operator-facing entry point for the latest rollout preparation state.
5. Keep the rollout preparation bounded to governance and operator readiness.

## Constraints

1. Do not build a generic tenant management platform.
2. Do not widen into automated provisioning or credentials orchestration.
3. Reuse existing readiness, review, and decision surfaces where possible.
4. Keep the slice narrow and explainable.

## Verification

Minimum verification:

1. `npm run test:unit`
2. `npm run build`
3. Runtime smoke:
   - create or load one onboarding/runbook entry
   - verify it renders in the intended operator surface
   - verify the persisted or computed state is visible through the intended API boundary

## Done when

This session is done when tenant widening no longer depends on operator memory alone and has one explicit in-product rollout preparation surface.
