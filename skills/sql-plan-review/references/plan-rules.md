# Plan rules

## Provenance before interpretation

- Record engine/version and supplied plan format. For Oracle, retain SQL_ID, child cursor, plan hash, bind descriptions, capture time, statistics mode and completeness when present. A plan hash is not a substitute for the SQL text or execution identity.
- `EXPLAIN PLAN` describes an optimizer estimate under its own environment. A cursor plan reflects a cursor's chosen plan; actual rows/time require the corresponding runtime statistics. Neither a `Time` estimate nor `Cost` is measured elapsed time.
- Compare only compatible captures: SQL, bind types/selectivity, data/statistics state, fetch completion and execution scope. `ALLSTATS LAST` and cumulative multi-execution output cannot be mixed without normalizing scope.
- Missing SQL or metadata still permits observations about the supplied plan. Keep SQL-semantic and index-design claims conditional rather than blocking all useful work.

## Read the tree and metrics

- Establish parent/child relationships from indentation/ids; distinguish access predicates from filters and locate the aliases used. Do not read output top-to-bottom as a simple execution timeline.
- For Oracle row-source statistics, check `Starts` before comparing `E-Rows` to `A-Rows`. Where the estimates are per start, compare actual rows per start to that estimate; label the calculation. Zero starts, adaptive inactive branches, parallel statistics and partial fetches need separate interpretation.
- Inspect the earliest meaningful row-count divergence that could amplify later work. A large final row count may simply be the requested result; a repeated inner operation can be costly despite few rows per invocation.
- Treat parent/child timing and buffer counts cautiously; do not sum inclusive metrics as independent totals. Prefer clearly attributed metrics and state their units/scope.
- Distinguish bytes/rows, buffers/logical I/O, physical reads, memory/temp spill and elapsed time. Do not infer disk I/O, blocking waits, client transfer time or CPU saturation from a bare plan that does not measure them.

## SQL and access path hypotheses

- A full scan may be efficient for a small table or a query needing much of a large table. An index can also cause expensive random lookups. Consider selectivity, clustering, requested columns and rows returned before suggesting an index.
- Inspect type conversions on the indexed column versus the bind. Use supplied column and JDBC/bind types to reason about `TO_NUMBER`, `TO_CHAR`, dates and NLS-sensitive conversions. A function-based index or different predicate may change the consequence; do not assume any function prevents all index use.
- Consider composite index leading columns, ranges, optional predicates, OR branches and partition keys only when metadata is supplied. An index name does not establish its definition.
- Check join cardinality and missing/incorrect join predicates against SQL semantics. Do not “optimize” by removing duplicate rows unless duplicates are demonstrably unintended.
- Preserve outer join semantics when moving predicates; preserve null behavior when rewriting `NOT IN`, `NOT EXISTS` or equality. Keep date ranges, time zones and inclusive/exclusive boundaries explicit.
- Distinguish estimated cardinality problems from proven stale statistics. Skewed binds, correlated columns, expressions and differing child cursors are alternative explanations. Do not prescribe a blanket statistics refresh or optimizer hint as a first step.

## Choose the next check

Use a compact observation → hypothesis → disconfirming check chain. Examples:

| Observation | Candidate explanation | Useful next evidence |
|---|---|---|
| Conversion on a VARCHAR2 key; numeric bind | Bound type changes usable predicate/value semantics | Same workload with correct declared bind type; plan/predicate, buffers and result equality |
| Inner operation starts far above expectation | Upstream cardinality or join multiplicity | Join key uniqueness, upstream actual rows and per-start work |
| Sort spills in supplied metrics | Actual volume exceeds memory available for that operation | Full fetch row count, sort/temp metrics under comparable load |
| Plan shape unchanged but latency varies | Waits/load/fetch effects not explained by shape | Existing timing/wait capture matching this execution |

Prefer using already supplied evidence before asking for more captures. Any diagnostic SQL is an optional, unexecuted collection proposal for the user's existing environment. Do not issue collection SQL yourself as part of this skill's default review.

## Reference basis

[Oracle 19c execution plans](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/generating-and-displaying-execution-plans.html) distinguishes estimated and actual plan evidence. The link is provenance, not a network requirement; use the deployed engine/version for syntax and behavior.
