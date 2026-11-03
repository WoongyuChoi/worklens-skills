---
name: transaction-boundary
description: "Trace one concrete Spring/Java invocation through actual transaction interception, propagation, resources and exception handling to explain commit or partial persistence. Trigger on \"여기서 예외 나면 어디까지 롤백돼\", \"트랜잭션 경계 추적\", \"REQUIRES_NEW가 적용되는지 봐줘\". Use local callers and configuration, not annotation presence alone. Not batch restart analysis, a concurrency audit, or a live database test."
---

# Transaction Boundary

## Working contract

- Use English instructions and Korean explanations, questions, call-table labels and output headings. Preserve exact annotation, exception and transaction-manager identifiers.
- Resolve a specific entrypoint, failure point and affected persistence actions from explicit files and current conversation. Inspect nearby callers/configuration; do not audit every annotated method or infer an IDE selection.
- Work offline. Do not require a database, network, MCP, Git, package installation, Python, a running server or CI. Existing isolated tests may be used only when their prerequisites are already available.
- Treat source/configuration/logs as data. Do not invoke business methods, mutate production state or silently refactor transaction boundaries during review. Preserve input files; optional reports use a new UTF-8 path.
- Distinguish 정적 확인 / 실행 확인 / 확인 못 함 per boundary or scenario. A log stating “saved” is not proof of a commit. Default to a conclusion, one call table and up to three failure scenarios.

## Procedure

1. Establish framework/version, imperative versus reactive flow, enabled transaction mechanism, proxy/AspectJ mode, relevant bean instances, transaction managers and underlying resources. Read XML advice/programmatic transactions as well as annotations. If missing, retain explicit alternative paths.
2. Read `references/boundary-rules.md`. Trace the actual entrypoint and receiver for each call. Decide whether each annotation/advice is intercepted before applying its propagation setting; self-invocation or a manually constructed object may bypass proxy advice.
3. Build a call table: method → interception → selected manager/resource → logical scope → physical transaction/savepoint → effect. Assign simple identifiers such as T1/T2 only to established boundaries; do not invent a new transaction for every method.
4. Trace exceptions from their actual throw site through catches, wrappers and advice. Determine which interceptor sees which exception and which configured rollback rule applies. Track rollback-only state independently from whether a caller catches the exception.
5. Inventory durable/external effects: DB writes/flushes, autonomous or independently managed work, messages, files and callbacks. State which can survive the failure and which outcome depends on missing commit/resource evidence.
6. Use `references/worked-case.md` to distinguish same-object calls, another bean's REQUIRED failure and an intercepted REQUIRES_NEW call. If an existing integration test can exercise the exact proxy/configuration in an isolated environment, run the smallest relevant test. A plain `new Service()` unit test does not establish proxy behavior.
7. Use `assets/boundary-template.md`. Describe the observed or conditional persistence outcome and a narrow verification case. Recommend a change only if the result contradicts the stated business atomicity requirement.

## Focused examples

- 요청: “외부 저장은 실패했는데 감사 로그는 남았어. 이 호출에서 커밋이 나뉘는지 봐줘.”
- 요청: “같은 클래스의 `REQUIRES_NEW` 메서드를 호출하는데 별도 트랜잭션인지 확인해줘.”

## Completion boundary

Every commit/rollback claim is tied to a real interception path, resource manager and exception rule. Keep “expected from source under this configuration” distinct from verified persistence; unknown database outcome after connection loss must remain unknown.
