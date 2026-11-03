# Restart rules

## Identity comes first

- In Spring Batch, compare job name and identifying JobParameters when establishing JobInstance identity. A new JobExecution of the same instance differs from a new instance processing the same business date.
- Retain parameter types and identifying flags from the actual version/launcher. A changed non-identifying diagnostic parameter need not create a new instance; a changed identifying `run.id` generally does.
- Read how the launcher obtains parameters. An incrementer declared on the job does not prove every launch uses it. Do not recommend `RunIdIncrementer` as a generic repair for restarting a failed instance.
- Inspect restartable status, prior execution state, `preventRestart`, start limits, step flow and completed-step policy. Completed steps are ordinarily skipped during restart; `allowStartIfComplete` can change that. A new instance can run them again.
- For plain batches, document the actual stored run key and resume rule. Terms such as retry, rerun and restart may be labels with different semantics; explain the observed behavior.

## Draw only real durable boundaries

- Trace reader state, processor, writer, commit interval, business transaction manager and repository updates. Confirm whether checkpoint and business writes participate in one atomic transaction or separate resources.
- If they commit together, “business committed but checkpoint not committed” is not a valid independent state for that unit under the stated atomicity. If they do not, inspect both possible orderings: replay of committed effects, or skipping effects not yet durable.
- External files, messages and HTTP effects can survive a DB rollback. A writer return or log line is not a DB commit. Connection loss can leave commit outcome unresolved until supported reconciliation evidence is available.
- Inspect `ItemStream` registration, reader state keys and `saveState`/restart support for the actual reader. A record count in a log is not necessarily a persisted reader position.
- A checkpoint denotes a reader-specific state, not universally a row number. Offset paging over a changing dataset can skip or revisit rows; assess stable ordering, unique tie-breakers, snapshot/cutoff rules and keyset behavior from actual code.

## Reapplying the operation

| Writer behavior | Questions for a replay |
|---|---|
| Plain INSERT | Is a durable unique constraint based on the business operation present? What happens on conflict? |
| Set deterministic total/status | Does repeating the same business input produce the same state? Can another run legitimately update it meanwhile? |
| Increment amount/counter | Does replay add again, even if a MERGE or upsert locates the same row? |
| Delete then insert | Are both atomic, and is the deletion scope stable and correctly bounded? |
| File append / message / external call | Is there a stable deduplication key, transactional coupling, or a repeatable replacement strategy? |
| Business-key claim then work | Are claiming and work atomic, or can a crash leave a claimed-but-unprocessed item? |

Separate job identity from business idempotency. A unique `(run_id, item_id)` allows the same item in a new run; it may not prevent duplicate settlement for `(business_date, account_id)`. Define intended legitimate reruns before selecting a key. A uniqueness constraint can prevent a duplicate row yet still make restart fail unless conflict handling is suitable.

## Retry, skip and parallel details

- Retries may re-invoke processors/writers. Side effects in a processor or listener can repeat even when the database writer rolls back.
- Skipped input, filtered output and failed chunks are different states. Inspect skip/retry policies and listeners, persisted counts and skip handling before inferring missing data from `readCount - writeCount` alone.
- For partitioned/multithreaded jobs, follow partition identity, execution contexts and reader/thread-safety assumptions. Do not apply a single global cursor model if workers have separate progress.
- Inspect steps that generate files, cleanup, transfer data or mark completion. Re-executing cleanup or skipping a previously completed setup step can change restart inputs.

## Useful verification

Prefer a small synthetic set with stable string keys and two failure points that distinguish atomic DB work from external effects. If an existing isolated test environment supports failure injection, observe persisted business state and repository state after the boundary, then use the actual restart API with the same identifying parameters. Do not connect to production or launch a real batch to complete this review.

## Reference basis

- [Spring Batch 5.1 job configuration](https://docs.spring.io/spring-batch/reference/5.1/job/configuring.html).
- [Step restart configuration](https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing/restart.html).
- These links document the design basis; use local project/version evidence offline rather than assuming the latest documentation's APIs match an older installation.
