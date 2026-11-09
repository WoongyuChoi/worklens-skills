# Lifecycle case design

Read this after identifying credential types and policy. Select applicable cases; do not impose every row on every authentication system.

## Establish the contract

Record credentials as aliases, never values. Use these Korean headings:

| 사건 | 대상 증표·장치 | 기대 유효성 | 정책 근거 | 실제 검증 경로 | 확인 수준 |
| --- | --- | --- | --- | --- | --- |
| 현재 장치 로그아웃 | 세션 A / 장치 A | 정책 확인 후 기입 | 요구사항·설정·명세 | 실제 경로·심볼 | 미실행 |

Distinguish browser state, application session, identity-provider session, access token and refresh grant. A documented short-lived access token may remain valid after refresh rotation. Offline access can have a different logout contract. Neither is automatically a vulnerability.

## Select useful cases

| Mechanism | Minimal sequence | Authoritative observation | Control / cause-based variant |
| --- | --- | --- | --- |
| Current-session logout | Access protected operation; logout; retry same credential | The session the policy ended cannot perform that operation | Another device remains usable when required; another route using the validator |
| Expiry | Use before deadline; advance injected clock; retry at/after boundary | Validator follows documented expiry semantics | Fresh credential; second credential issued at another time |
| Refresh rotation | Refresh; use new grant; reuse old refresh | Prior refresh rejected; lineage handling matches policy | New valid lineage before any reuse-triggered revocation; another old lineage member |
| Concurrent consumption | Two workers reach same consume boundary; release | No forbidden second usable grant or protected effect | Sequential consumption; independent artifact succeeds |
| Recovery proof | Complete required proof; change credential; replay proof | Server verifies user/purpose binding and consumption | Fresh legitimate proof; expired, wrong-purpose or wrong-user proof |
| Authentication upgrade | Start anonymous/pre-MFA state; complete login/MFA; reuse old state | Old state cannot acquire upgraded authority unless intended | Upgraded session works; independent pre-upgrade session remains restricted |
| Revocation persistence | Revoke; recreate isolated worker on same disposable store; retry | Revocation survives the tested boundary | Unrevoked session works; distinguish from actual cluster restart |

Pick one demonstrated or supported cause and preserve its failing sequence. Add a variant that can reveal an incomplete fix; do not append unrelated JWT algorithm tests to a server-session defect.

## Keep the oracle independent

1. Derive expected results from the contract, not the patched implementation.
2. Call the actual validator/handler. A replacement helper that always denies proves nothing.
3. Observe protected data or effects, not only status. An exception before the handler runs can invalidate the test.
4. Apply the same assertion to original and changed source. Preserve the failing original case, changed outcome and normal control.
5. Record aliases, timing values, command, source paths/hash when available and environment. Do not require Git to identify source.

## Report limits

- `정적 의심`: source evidence without valid execution evidence.
- `합성 소스 실행 확인`: synthetic project execution; no company-system claim.
- `프로젝트 처리 경로 확인`: actual project handler with named test doubles; integrations unverified.
- `통합 환경 실행 확인`: only the exact authorized environment and tested boundaries.
- `확인 못 함`: missing policy, runtime, identity, storage or coordination; name the concrete gap.

Report single-process and in-memory limits. Do not add a database or denylist to a self-contained JWT design solely to satisfy an invented immediate-logout rule. Explain the established contract or policy gap instead.
