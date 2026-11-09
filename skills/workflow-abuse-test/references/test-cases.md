# Business sequence case design

Read this after establishing states, actors and effects. Select a bounded set suited to the workflow, not every web attack.

## Derive the effect contract

Use these Korean headings:

| 시작 상태 | 행위자 | 호출 순서 | 허용 전이 | 기대 업무 효과 | 실제 효과 | 근거 |
| --- | --- | --- | --- | --- | --- | --- |
| 자료에서 확인 | 합성 사용자 별칭 | 실제 함수·경로 | 정책으로 기입 | 전표·자원·알림 수 | 실행 후 기입 | 파일·심볼·명령 |

Inspect amounts, ledger entries, stored state or downstream actions. A rejected response may still accompany an effect. Two accepted responses may be harmless if they identify the same single effect.

## Candidate sequences

| Mechanism | Small sequence | Required observation | Variant / normal control |
| --- | --- | --- | --- |
| Skipped prerequisite | Final operation from an earlier reachable state | Rejected transition, no effect | Another disallowed state; full normal sequence |
| Completed-step replay | Complete once; repeat | One effect; response follows contract | Another entry point/event for same operation; new independent work |
| Cancelled/stale state | Cancel or advance version; use earlier state | No forbidden effect or overwritten final state | Another stale version; current valid version |
| Retry key mismatch | Same key with changed parameters | Key binds caller, operation and request meaning; mismatch rejected | Same-parameter retry; independent legitimate key |
| Cross-caller cache | Another caller presents existing key | Authorization precedes cached-result disclosure | Original caller retry; independent caller's own request |
| Concurrent duplicate | Two workers act on one eligible item | Contested boundary reached; only permitted effect occurs | Same event via another applicable consumer; independent items finish |
| Unknown outside result | Adapter records effect then loses response; retry | Recovery follows contract without blind duplicate effect | Known failure before effect; normal completed response |

Do not invent provider guarantees, retry windows or financial rules. If no retry key exists, test the actual business operation identity instead of adding a key just to match this table.

## Two-worker evidence

Use an existing async/storage seam or a local adapter preserving the target handler. Coordinate arrival and release with a bounded barrier, not arbitrary sleeps. Record arrivals. A valid repair may stop the second worker before a downstream point; use bounded observation/release so the test cannot deadlock while preserving the original business assertion.

Do not remove async boundaries, serialize only the test caller or replace the effect-producing handler. A single-process lock does not prove multiple-worker or database safety. A mocked store does not prove production isolation.

Inspect rejected requests for partial state/effects. If a repair reserves work before an outside action, define failed and unknown states and their recovery; note any unresolved permanent in-progress risk.

## Repair and regression record

Retain the original case unchanged, one cause-based variant and an independent legitimate control:

- `수정 전`: source, sequence, state/effect, independent assertion and command.
- `최소 수정`: changed responsible boundary and policy rationale.
- `같은 사례`: unchanged evidence after repair.
- `원인 기반 변형`: another state/entry point/request sharing the cause.
- `정상 대조군`: legitimate behavior, including independent work to catch overbroad locking/deduplication.
- `남은 범위`: actual DB, processes, provider, timeout or restart boundaries not tested.

Base the oracle on business policy. Do not mirror implementation predicates/arithmetic as the sole assertion or claim complete workflow security from a finite case set.
