---
name: schedule-lens
description: "Preview bounded Spring-style cron schedules and possible batch overlaps from explicit expressions, fixed UTC offsets, and measured durations. Use when a user asks when jobs run, collide at month-end, or disagree with an intended schedule; do not use to register jobs or diagnose production execution from cron alone."
---

# Schedule Lens

Turn scheduler declarations into candidate starts and possible overlapping intervals. Keep the dialect, time basis, support limits, and missing duration evidence visible.

## Working contract

- Work offline with supplied code, configuration, logs, and the self-contained browser asset. No installation, network, service connection, or new library is required.
- Write user-facing explanations, labels, and conclusions in Korean. Preserve original cron expressions, job identifiers, and source locations.
- A calculated trigger is not evidence that a server ran a job. Do not infer availability, execution ordering, locking, or successful completion.
- Use an explicitly identified dialect and time basis. Do not silently translate Linux, Quartz, or a named time zone into the supported subset.
- The HTML asset is a bounded calculator, not an implementation of every Spring scheduling feature.

## Workflow

1. Read the actual scheduler registration and effective cron value. Record the file and lines, scheduler/library version if available, any `zone` setting, and unresolved property overrides. A comment alone is insufficient evidence.
2. Identify the question: next starts, month-end coverage, simultaneous starts, or possible runtime overlap. Use the requested window; if none is provided, use the next 31 days and label that choice.
3. Apply `references/supported-syntax.md`. The tool accepts only `spring6-fixed-offset`. If unsupported semantics are needed, give a precise unsupported result and the smallest extra evidence required. Do not manufacture a preview.
4. Collect one fixed UTC offset valid throughout this preview and each job's known duration in seconds. Leave duration `null` when unknown. Use measured typical/worst-case durations as separate scenarios, with their source and observation window.
5. Open or copy `assets/tool.html`. Paste the contract illustrated by `assets/example-request.json`, run the preview, and retain result JSON. If the host cannot open a browser, provide the HTML and prepared JSON to the user. With detected Node, run `node <skill-folder>/scripts/tool.cjs <request.json> <new-result.json>`; the output path must be new and is never overwritten. Standard input/output is also accepted when no arguments are given. Node is not a prerequisite.
6. Check completeness before interpreting collisions. A run cap or collision cap makes the list incomplete. Reduce the period, split jobs, or raise the cap within supported bounds before claiming that the requested window has no collisions.
7. Explain actionable overlaps with both cron sources, explicit offset, candidate start, assumed duration, and whether they are merely simultaneous starts. Actual locks or serialization can prevent concurrent execution; confirm that from code/configuration.

## Deliverable

Use `assets/review-template.md`. Include confirmed dialect/time basis and source locations; the half-open preview window; generated starts per job and completeness; a collision table with duration assumptions; relevant unsupported syntax; and an evidence-based next check.

For query ranges and business dates rather than cron triggers, use `business-time-boundary`. For partial execution failures, use `batch-restart-check`.

## Stop conditions

- Five/seven fields, names/macros, `L/W/#`, named zones with unverified offset transitions, calendar exceptions, misfire behavior, and unresolved properties cannot be calculated by this asset.
- Both day-of-month and day-of-week constrained is intentionally rejected. Do not guess another scheduler's AND/OR rule.
- A missing execution in logs is not explained solely by a matching cron expression.

## Example request

“이 두 배치가 월말에 겹치는지 봐줘. cron 설정과 최근 수행시간은 첨부했어.”

Return a source-backed preview and distinguish calculated trigger times from observed executions.
