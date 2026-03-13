# CEOClaw Session Operating Model

**Date:** 2026-03-11
**Status:** Active

**Canonical source of current execution truth:** `plans/2026-03-11-ceoclaw-master-execution-plan.md`

This document defines operating rules. It is not the canonical place for live session status.

## 1. Working Modes

There are two valid ways to work on CEOClaw.

### Mode A: Lead-only sequential

Use this when:
- repo stability is uncertain;
- a change crosses multiple layers;
- schema and policy are moving;
- we need clean integration more than raw speed.

### Mode B: Lead + worker sessions

Use this when:
- the current wave has isolated file zones;
- prompt files clearly separate ownership;
- build baseline is already stable;
- merge cost is acceptable.

## 2. Recommended Mode by Phase

### Right now

Use a hybrid of `Mode A` and `Mode B`.

Reason:
- Wave 0 is already closed;
- build and unit verification are stable enough for controlled worker use;
- the repo now needs narrow deepening passes, not repo-wide rescue work.

### For the next batch

Prefer lead-first sequencing for the active sessions defined in the master execution plan.

As of 2026-03-12 after Session 42 landed, Wave 11 is complete and the next lead-first step is to define Wave 12 before opening new implementation prompts.

Recommended concurrency:
- 1 lead session to define Wave 12 because the next canonical bottleneck should now be chosen from evidence rather than guessed;
- keep worker sessions paused until a Wave 12 prompt exists or a clearly isolated follow-up slice is identified;
- 2 worker sessions maximum only after the next wave has clearly isolated domains;
- 3 sessions maximum per wave for now.

## 3. Session Roles

### Lead session

Responsibilities:
- master plan;
- repo stabilization;
- cross-cutting changes;
- merge review;
- final verification;
- wave transitions.

This should be my role.

### Worker session

Responsibilities:
- execute one scoped prompt;
- stay within allowed files;
- run local verification;
- return a concise completion report.

## 4. Session Lifecycle

1. Pick the current wave.
2. Pick one prompt file.
3. Start one session with that prompt and no extra side missions.
4. Session completes its local scope.
5. Session returns:
   - changed files;
   - tests run;
   - blockers;
   - assumptions;
   - follow-up needed from integration.
6. Lead session reviews and integrates.
7. Only then start the next wave.

## 5. What You Should Paste Into Worker Sessions

Use exactly one of the files from:

- [session-01-import-pipeline.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-01-import-pipeline.md)
- [session-02-ai-action-engine.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-02-ai-action-engine.md)
- [session-03-executive-briefs.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-03-executive-briefs.md)
- [session-04-work-reports.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-04-work-reports.md)
- [session-05-connectors.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-05-connectors.md)
- [session-06-ui-shell.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-06-ui-shell.md)
- [session-07-org-workspace-policy.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-07-org-workspace-policy.md)
- [session-08-plan-vs-fact.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-08-plan-vs-fact.md)
- [session-09-meeting-to-action.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-09-meeting-to-action.md)
- [session-10-work-report-signal-loop.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-10-work-report-signal-loop.md)
- [session-11-live-connector-upgrade.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-11-live-connector-upgrade.md)
- [session-12-telegram-brief-delivery.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-12-telegram-brief-delivery.md)
- [session-13-scheduled-digests.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-13-scheduled-digests.md)
- [session-14-second-live-datasource-connector.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-14-second-live-datasource-connector.md)
- [session-15-gps-telemetry-ingestion.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-15-gps-telemetry-ingestion.md)
- [session-16-evidence-ledger.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-16-evidence-ledger.md)
- [session-17-ai-trace-evals.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-17-ai-trace-evals.md)
- [session-18-1c-live-read-connector.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-18-1c-live-read-connector.md)
- [session-19-operator-escalation-queue.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-19-operator-escalation-queue.md)
- [session-20-live-vs-demo-truth.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-20-live-vs-demo-truth.md)
- [session-21-email-delivery-channel.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-21-email-delivery-channel.md)
- [session-22-video-fact-mvp.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-22-video-fact-mvp.md)
- [session-23-cross-source-confidence-fusion.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-23-cross-source-confidence-fusion.md)
- [session-24-action-safety-compensation-layer.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-24-action-safety-compensation-layer.md)
- [session-25-knowledge-and-benchmark-loop.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-25-knowledge-and-benchmark-loop.md)
- [session-26-enterprise-truth-expansion.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-26-enterprise-truth-expansion.md)
- [session-27-ai-run-persistence-ledger.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-27-ai-run-persistence-ledger.md)
- [session-28-evidence-and-escalation-sync-jobs.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-28-evidence-and-escalation-sync-jobs.md)
- [session-29-delivery-ledger-idempotent-execution.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-29-delivery-ledger-idempotent-execution.md)
- [session-30-gps-telemetry-domain-expansion.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-30-gps-telemetry-domain-expansion.md)
- [session-31-1c-financial-truth-deepening.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-31-1c-financial-truth-deepening.md)
- [session-32-reconciliation-casefile-fact-linking.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-32-reconciliation-casefile-fact-linking.md)
- [session-33-executive-command-center-exception-inbox.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-33-executive-command-center-exception-inbox.md)
- [session-34-audit-pack-and-operational-exports.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-34-audit-pack-and-operational-exports.md)
- [session-35-pilot-controls-and-tenant-readiness.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-35-pilot-controls-and-tenant-readiness.md)
- [session-36-pilot-feedback-ledger-resolution-loop.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-36-pilot-feedback-ledger-resolution-loop.md)
- [session-37-tenant-readiness-cutover-checklist.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-37-tenant-readiness-cutover-checklist.md)
- [session-38-pilot-review-scorecards-governance-export.md](/Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test/doc/session-prompts/session-38-pilot-review-scorecards-governance-export.md)

Do not combine prompt files in one worker session.

## 6. Rules for Running Parallel Sessions

1. Maximum three worker sessions at once.
2. One session per prompt file.
3. No overlapping ownership of `prisma/schema.prisma`.
4. No overlapping ownership of the same API subtree.
5. No worker session should rewrite unrelated tests or layout files.
6. Lead session always merges; workers do not self-integrate across waves.

## 7. Best Launch Pattern

### Stage 1

Only one session:
- lead session closes Wave 0.

### Stage 2

Wave 1 is complete on the lead branch:
- Session 01;
- Session 02;
- Session 03.

### Stage 3

Wave 2 worker batch:
- Session 05;
- Session 06.

### Stage 4

Lead session merges and repairs integration issues.
Status: complete on 2026-03-11. Imports, briefs, work reports, and integrations UI now target live backend contracts.

### Stage 5

Run Session 07 first.
Status: complete on 2026-03-11. Organization/workspace/membership schema landed, preferences are role-gated, and Wave 2 API routes now use the shared access helper.

### Stage 6

Run Session 08 after Session 07 lands or in controlled overlap if schema is untouched.
Status: complete on 2026-03-11. Lead track landed shared plan-vs-fact services, new `/api/analytics/plan-fact`, and live integration into overview, predictions, recommendations, and brief generation.

### Stage 7

Repeat the same pattern for the next wave: workers implement in isolated zones, lead session integrates and verifies.
Status: Sessions 09 through 26 are complete on 2026-03-11. Meeting-to-action, work-report signal packets, live connector reads, outbound delivery, evidence fusion, action safety, knowledge loop, and enterprise truth expansion now work on the lead branch.

### Stage 8

Start the next sequence only after the previous one is canonically fixed in the master plan.
Status: Sessions 27 through 42 are complete, Wave 9 and Wave 10 are complete, and Wave 11 is now complete on the lead branch.

## 8. When Not to Parallelize

Do not parallelize when:
- the same files are being edited;
- build is red for unknown reasons;
- schema is changing broadly;
- auth/policy are in flux;
- the previous wave is not yet merged.

## 9. When I Can Work Without Your Constant Control

I can safely drive work without constant intervention when:
- we are inside one clearly scoped wave;
- the prompt and goal are already fixed;
- no product-level decision is blocked;
- there is no conflict with your own in-progress edits.

That means:
- yes, I can keep moving sequentially on the lead track;
- yes, I can prepare prompts, plans, integration rules, and repo cleanup;
- yes, I can usually continue implementation until a real product choice or conflict appears.

## 10. What I Recommend You Do

Right now:

1. Wave 0 no longer blocks parallel execution.
2. Sessions 01 through 42 are complete on the lead branch.
3. Keep exact active session selection in the master execution plan, not here.
4. Wave 7, Wave 8, Wave 9, and Wave 10 are complete on the lead branch.
5. Wave 11 governance automation and controlled widening is complete on the lead branch, and the next canonical step is to define Wave 12.

## 11. Success Condition for This Operating Model

This model is working if:
- workers stop stepping on each other;
- each wave lands cleanly;
- integration time is less than implementation time;
- we are shipping product layers, not just collecting partial code.
