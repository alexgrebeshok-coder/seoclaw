# Session 21: Email Delivery Channel

## Goal

Add the first honest outbound email channel after Telegram.

This session must produce a working end-to-end flow:

`SMTP probe -> email connector status -> executive brief preview/send -> operator-visible delivery result`

## Scope

Work only in the email delivery slice:

- `lib/connectors/**` for SMTP client and email adapter
- `lib/briefs/**` for the email delivery service
- `lib/validators/**` for route input validation
- `app/api/connectors/email/**`
- selected `components/briefs/**`
- focused policy/runtime truth updates only where the product would otherwise lie
- focused unit coverage only

## Product intent

The product already has:

1. a real brief engine;
2. a real Telegram delivery channel;
3. a real live/demo truth layer.

What is missing is the second outbound proof that does not depend on Telegram semantics.

This session should add an honest SMTP-backed path without pretending queueing, templating, or enterprise notification orchestration that does not yet exist.

## Requirements

1. Add a shared SMTP client with:
   - transport verification;
   - plain-text send support;
   - explicit required env handling.
2. Upgrade the email connector from stub to live:
   - `pending` when SMTP secrets are missing;
   - `degraded` when verification fails;
   - `ok` only when transport verification succeeds.
3. Add one operator-safe route:
   - `POST /api/connectors/email/briefs`
   - support both `dryRun` and real delivery
4. Reuse existing brief content:
   - do not invent a second email rendering model.
5. Show the path in operator UX on `/briefs`:
   - preview content;
   - recipient target;
   - delivery result.
6. Keep runtime truth honest:
   - if brief facts are demo but email delivery is live, the operator should see that clearly.

## Constraints

1. Do not introduce background email queueing.
2. Do not add HTML templating or marketing email concerns.
3. Do not broaden into escalation emails or approval digests yet.
4. Do not fake delivery success without transport confirmation.
5. Keep the slice focused on executive brief delivery only.

## Verification

Minimum verification:

1. `npm run test:unit`
2. `npm run build`
3. Runtime smoke with a local SMTP listener:
   - `/api/connectors/email`
   - `POST /api/connectors/email/briefs`
   - `/briefs`

## Done when

This session is done when email is no longer a stub, an operator can preview and send a brief through the live SMTP connector, and the UI/API clearly distinguish live outbound delivery from demo brief facts.
