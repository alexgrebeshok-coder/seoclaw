# Session 18: 1C Live Read Connector

## Goal

Upgrade 1C from a permanent stub into the first honest read-only enterprise finance slice.

This session must produce a working end-to-end flow:

`1C API -> shared client -> normalized finance read route -> operator-facing sample`

## Scope

Work only in the 1C connector slice:

- `lib/connectors/**`
- `lib/connectors/one-c-client.ts`
- `app/api/connectors/one-c/**`
- one narrow operator surface in `components/integrations/**`
- connector-focused unit and route tests only

## Product intent

The product already has GPS evidence and AI provenance. The next trust gain should come from a second real enterprise read source.

This session should add the smallest valuable 1C step:

1. one honest live read probe;
2. one normalized financial sample payload;
3. one visible operator sample proving that 1C-backed finance facts can enter the product.

## Requirements

1. Keep the connector explicitly read-only.
2. Add one live 1C sample route, such as:
   - `/api/connectors/one-c/sample`
3. Reuse a shared 1C client rather than embedding HTTP logic in the route or adapter.
4. Normalize a minimal payload that includes:
   - `projectId`;
   - `projectName`;
   - `reportDate`;
   - `plannedBudget`;
   - `actualBudget`;
   - `paymentsActual` or similar;
   - `status`;
   - a small set of provider metadata or counters.
5. Surface the result in an operator-friendly place on `/integrations` or the connector detail view.
6. Keep response honesty:
   - `pending` when credentials are missing;
   - `degraded` when the remote system responds badly;
   - `ok` only when a valid project finance sample is returned.
7. Update connector tests and route coverage.

## Constraints

1. Do not introduce write-back semantics in this session.
2. Do not add Prisma schema changes.
3. Do not build a broad ERP abstraction layer.
4. Do not invent enterprise fields that the configured 1C endpoint does not actually provide.
5. Prefer one trustworthy finance sample over a wide but shallow 1C API surface.

## Verification

Minimum verification:

1. `npm run test:unit`
2. `npm run build`
3. Runtime smoke:
   - `GET /api/connectors/one-c`
   - `GET /api/connectors/one-c/sample`
   - `GET /api/connectors`
   - `GET /integrations`

## Done when

This session is done when the operator can inspect real 1C-backed finance facts through API and UI, and the connector remains explicit about whether it is healthy, missing configuration, or degraded.
