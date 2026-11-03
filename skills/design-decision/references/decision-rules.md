# Decision rules

## Evidence before preference

Use a small ledger: claim / source / certainty. A dependency already present in a build file is not proof that every deployed runtime provides it. A public method is not proof of external consumers; inspect callers and mark out-of-repository consumers unknown.

Constraints may include a single DB transaction, an external caller's fixed DTO, generated-source restrictions, a fixed rollout order, or a ban on new libraries. Treat a supplied constraint as binding and a guessed constraint as an assumption. Avoid “high/medium/low” scores that hide different tradeoffs; explain the concrete consequence.

## Comparison checklist

| Axis | Evidence to gather | Avoid |
|---|---|---|
| Responsibility | Current data owner, caller, policy location | “Clean architecture” as the sole reason |
| Contract | Input, output, error and compatibility behavior | Renaming a class as a complete design |
| Atomicity | Existing transaction entry and side effects | Claiming a remote call shares a DB transaction |
| Testability | Existing seams and test runtime | Requiring a new mock framework |
| Migration | Coexisting callers and editable files | Assuming an atomic rollout without evidence |
| Operation | Existing deployment and diagnostics | Inventing latency or staffing numbers |
| Reversal | Data changes and compatibility | Calling data loss reversible because code can be reverted |

Choose named, observable revisit conditions: a second real consumer with a conflicting policy, a measured contention problem, or a required independent release. “When scale grows” is not testable.

## Synthetic example — not project evidence

Current files are supplied as part of this example:

- `OrderController.java#create`: validates the request shape and calls `OrderService.place`.
- `OrderService.java#place`: loads a customer, checks credit policy, writes an order in its current transaction.
- `OrderImport.java#importRow`: calls the same service.

Question: where should a new credit rule live?

| 대안 | 실제 변경 지점 | 판단 |
|---|---|---|
| Controller 안 | `OrderController#create` | import 경로가 우회하므로 두 진입점에 공통 적용한다는 제약을 위반합니다. |
| 현재 서비스 안 | `OrderService#place`, 기존 테스트 | 정책이 한 곳에 있고 기존 트랜잭션을 유지합니다. 규칙이 작으면 가장 적은 변경입니다. |
| 순수 정책 객체 추출 | `CreditPolicy#evaluate` 추가, `OrderService#place`, 정책 테스트 | 복수 규칙의 독립 검증에 유리하지만 객체/계약 하나를 추가합니다. 새 서비스 배포는 필요 없습니다. |

Example recommendation: choose the current service for one small rule, or the pure policy object when independent rule cases already justify it. The controller option is infeasible under the shared-entry constraint; do not score it as a cheaper valid alternative. No throughput claim is justified by this example.
