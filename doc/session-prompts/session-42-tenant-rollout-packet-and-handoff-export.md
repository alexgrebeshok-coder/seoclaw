# Session 42: Tenant Rollout Packet and Handoff Export

## Goal

Turn the onboarding runbook into one deterministic handoff packet for real tenant widening without building a workflow engine.

This session must produce a working end-to-end flow:

`tenant readiness + pilot review + cutover decisions + onboarding runbook -> rollout packet / handoff export -> operator-ready promotion package`

## Scope

Work only in the rollout-handoff slice:

- selected routes under `app/api/**`
- selected operator surfaces under `components/**`
- narrow handoff/export helpers under `lib/**`
- focused planning-copy updates where rollout handoff would otherwise be overstated
- focused unit coverage only

## Product intent

The product already has tenant readiness, pilot review scorecards, recurring governance delivery, a durable cutover decision register, and a persisted tenant onboarding runbook.

What is still missing is one explicit handoff packet that operators can open or export when the next tenant rollout conversation becomes real.

This slice must stay honest:

- no approval workflow engine;
- no tenant provisioning orchestration;
- one narrow rollout packet and handoff export surface first.

## Requirements

1. Add one operator-visible way to open or export the current rollout packet.
2. Reuse onboarding runbook, readiness, review, and decision boundaries as input.
3. Make the packet deterministic enough to share in the next rollout conversation.
4. Expose one operator-facing entry point for the latest handoff state.
5. Keep the slice bounded to governance and operator handoff.

## Constraints

1. Do not build a broad rollout workflow engine.
2. Do not widen into provisioning, credentials orchestration, or notifications sprawl.
3. Reuse the existing readiness, review, decision, and onboarding surfaces wherever possible.
4. Keep the slice narrow and explainable.

## Verification

Minimum verification:

1. `npm run test:unit`
2. `npm run build`
3. Runtime smoke:
   - load one runbook-backed rollout packet
   - verify it renders in the intended operator surface
   - verify the packet or export is visible through the intended API boundary

## Done when

This session is done when tenant widening handoff no longer depends on manually stitching together four separate surfaces.
