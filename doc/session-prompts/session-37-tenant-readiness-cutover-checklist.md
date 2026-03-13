# Session 37: Tenant Readiness and Cutover Checklist

## Goal

Make tenant-level pilot readiness explicit before broader live cutover.

This session must produce a working end-to-end flow:

`tenant runtime and rollout posture -> readiness checklist -> explicit go-live blockers`

## Scope

Work only in the readiness/cutover slice:

- selected policy/runtime files under `lib/server/**`
- selected read-model helpers under `lib/**`
- selected routes/pages under `app/**`
- selected operator surfaces under `components/**`
- focused planning-copy updates where rollout readiness would otherwise be overstated
- focused unit coverage only

## Product intent

The product now has pilot controls, connector truth, runtime truth, and command surfaces.

What is missing is one operator-facing readiness view that says whether a tenant is actually safe to promote.

This slice must stay honest:

- no broad tenant admin console;
- read-only readiness first;
- explicit blockers over vague “should be fine” posture.

## Requirements

1. Add one tenant-readiness model tied to existing runtime truth and rollout posture.
2. Include at least runtime state, connector or credential blockers, and unresolved rollout concerns from existing surfaces.
3. Surface one clear readiness outcome such as blocked, guarded, or ready-with-warnings.
4. Keep drillback to the source surfaces that still require action.
5. Preserve the narrow pilot-control model introduced in Session 35.

## Constraints

1. Do not build secret-management or provisioning infrastructure.
2. Do not redesign the workspace or membership model.
3. Keep the slice read-only and operator-facing.
4. Reuse existing runtime truth, connector status, and pilot-control helpers.

## Verification

Minimum verification:

1. `npm run test:unit`
2. `npm run build`
3. Runtime smoke:
   - one blocked tenant-readiness posture
   - one guarded or ready-with-warnings posture

## Done when

This session is done when an operator can inspect one tenant’s rollout readiness, see why it is blocked or safe to promote, and drill back to the underlying source of each blocker.
