# Session 22: Video Fact MVP

## Goal

Port the smallest useful visual evidence loop from AI-PMO into CEOClaw.

This session must produce a working end-to-end flow:

`video reference intake -> persisted evidence record -> narrow verification rule -> operator-visible summary`

## Scope

Work only in the visual evidence slice:

- `lib/video-facts/**`
- focused validator and route work under `lib/validators/**` and `app/api/work-reports/**`
- selected `components/work-reports/**`
- narrow copy updates where the product would otherwise lie about evidence sources
- focused unit coverage only

## Product intent

The product already has:

1. approved work reports;
2. GPS observed facts;
3. evidence ledger states;
4. operator escalation and provenance.

What is missing is the first visual-evidence proof that can confirm or challenge field reporting without pretending a full computer-vision pipeline.

This MVP should be honest:

- metadata intake, not binary video processing;
- one verification rule, not a general confidence engine;
- one operator summary, not a full media review workspace.

## Requirements

1. Add one visual evidence ingestion path that records:
   - linked work report;
   - capture timestamp;
   - video URL/reference;
   - observation type;
   - optional operator summary.
2. Persist the visual fact into the same truth layer:
   - create a document-like reference if needed;
   - create a real evidence record.
3. Add one narrow verification rule:
   - `verified` only when the visual fact is linked to an approved work report from the same reporting day;
   - otherwise keep it `observed`.
4. Surface one operator-facing summary on `/work-reports`:
   - counts;
   - latest facts;
   - verification rule/result.
5. Expose one API route for list/create:
   - `GET /api/work-reports/video-facts`
   - `POST /api/work-reports/video-facts`
6. Keep demo/live behavior honest:
   - do not allow write actions in demo mode.

## Constraints

1. Do not build real upload storage.
2. Do not introduce OCR or CV inference.
3. Do not create a new general-purpose evidence framework.
4. Do not add more than one verification rule in this session.
5. Keep the slice anchored to work-report operations.

## Verification

Minimum verification:

1. `npm run test:unit`
2. `npm run build`
3. Runtime smoke:
   - `POST /api/work-reports/video-facts`
   - `GET /api/work-reports/video-facts`
   - `/work-reports`

## Done when

This session is done when an operator can register a visual fact, see whether it is merely observed or actually verified against an approved field report, and the product stays explicit about the narrowness of that rule.
