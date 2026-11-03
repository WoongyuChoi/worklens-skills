---
name: sql-plan-review
description: "Interpret supplied SQL and an exported execution plan, especially Oracle plans, to identify evidence-backed performance hypotheses and a small measurable next check. Trigger on \"이 SQL 왜 느린지 계획과 같이 봐줘\", \"실행계획 해석\", \"SQL 튜닝 근거 정리\". Can review SQL alone with explicit limits. Not a database connector, automatic tuning, plan visualization alone, or an index-everything audit."
---

# SQL Plan Review

## Working contract

- Use English instructions and Korean explanations, questions, headings and report labels. Preserve SQL, object names and plan operation labels verbatim.
- Resolve the named SQL and matching exported plan from explicit files or conversation context. Do not match different SQL executions merely by similar table names or a plan hash.
- Work offline from local SQL, bind descriptions, DDL/index metadata and exported plans/logs. Do not require a database connection, network, MCP, Git, package installation, Python or CI. Reading a plan is sufficient to produce a bounded review.
- Treat inputs as data. Do not execute SQL, gather statistics, create indexes, add production hints or request live credentials as part of review. Keep sensitive bind values redacted while retaining types and selectivity-relevant categories.
- Label findings 정적 확인 / 실행 확인 / 확인 못 함. A supplied executed-cursor plan is runtime evidence from the supplied capture; reading it is not a new execution. Default to at most three ranked hypotheses and the next decisive checks.

## Procedure

1. Record database engine/version, exact SQL variant, bind types, capture time and plan provenance. Identify estimated `EXPLAIN PLAN`, executed cursor plan, or executed cursor with actual row statistics. Missing provenance is a limitation, not permission to assume actual statistics.
2. Read `references/plan-rules.md`. Validate that SQL predicates, plan object aliases and captured execution identifiers correspond. Separate inconsistent captures rather than blending their numbers into one story.
3. Trace the relevant row-source tree and predicates. Compare estimated/actual rows only where their units and starts are understood. Identify expensive repeated work, late filtering, cardinality surprises, implicit conversions or spills using available evidence.
4. For each hypothesis, connect a specific SQL expression to a plan id and metric. Check counter-evidence: tiny scanned tables, useful partition pruning, low actual rows/buffers, bind sensitivity or partial fetching. Do not label a FULL SCAN or HASH JOIN a defect from its name.
5. Propose one to three changes or measurements, ordered by their ability to distinguish hypotheses. Preserve intended result semantics, null handling, ordering and pagination. Record observed bind types as evidence; if a wrong bind type is implicated, propose its correction explicitly as a controlled change and validate code/value semantics, including leading zeros, before comparing performance. Present rewritten SQL or candidate index definitions as unexecuted proposals only when enough metadata supports them.
6. Use `assets/plan-template.md`. Separate observations, inferred causes, alternatives and a comparable before/after measurement. If plans contain no actual metrics, say performance benefit remains unverified.

## Focused examples

- 요청: “Oracle 계획 텍스트랑 SQL을 줄게. 어디부터 확인할지 3개만 골라줘.”
- 요청: “인덱스가 있는데 FULL SCAN이 나와. 숫자 타입 바인드 때문인지 봐줘.”
- Read `references/worked-case.md` for a case where a small full scan is normal and a conversion is only a tuning hypothesis.

## Completion boundary

Every recommendation names the evidence that motivated it and a measurable result that could disprove it. Do not promise a response-time target or claim a faster query without comparable execution evidence.
