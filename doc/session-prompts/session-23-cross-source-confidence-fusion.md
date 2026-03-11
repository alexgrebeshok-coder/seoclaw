# Session 23: Cross-Source Confidence Fusion

## Goal

Combine work reports, GPS telemetry, and linked visual evidence into one explainable confidence model.

This session must produce a working end-to-end flow:

`evidence records -> merge rules -> confidence rollup -> provenance explanation -> operator-visible fusion view`

## Scope

Work only in the fusion and provenance slice:

- `lib/evidence/**`
- focused route work under `app/api/evidence/**`
- selected `components/integrations/**`
- narrow metadata enrichment where current evidence is too weak to support honest matching
- focused unit coverage only

## Product intent

The product already has:

1. work reports with `reported / verified`;
2. GPS observed facts;
3. linked visual facts;
4. evidence ledger and operator provenance surfaces.

What is missing is the first cross-source trust layer that answers:

- which facts are still single-source claims;
- which facts are corroborated by independent signals;
- why a fact is treated as `reported`, `observed`, or `verified`.

This slice must stay honest:

- explainable merge rules, not opaque scoring;
- one operator fusion surface, not a new analytics module;
- work-report anchored rollup, not a generic event-correlation engine.

## Requirements

1. Add confidence merge rules for at least two independent source combinations:
   - work report + linked visual fact;
   - work report + matching GPS evidence;
   - bonus if all three corroborate.
2. Keep provenance visible:
   - show which source records participated;
   - show why they matched;
   - show final confidence and status.
3. Add one API surface:
   - `GET /api/evidence/fusion`
4. Add one operator UI surface on `/integrations` that shows:
   - fused fact summary;
   - top fused facts;
   - explanation for why each fact is `reported`, `observed`, or `verified`.
5. Enrich metadata only where necessary to support honest matching.

## Constraints

1. Do not create a general event graph.
2. Do not add ML ranking or hidden heuristics.
3. Do not introduce background jobs.
4. Do not fuse unrelated enterprise sources in this session.
5. Keep the anchor model explicit: work report first, corroborating signals second.

## Verification

Minimum verification:

1. `npm run test:unit`
2. `npm run build`
3. Runtime smoke:
   - `GET /api/evidence/fusion`
   - `/integrations`

## Done when

This session is done when an operator can see one fused confidence view that explains which facts remain single-source claims and which ones are corroborated by visual or telemetry evidence, without the product pretending a broader truth engine than it actually has.
