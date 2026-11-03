# Source-to-policy workflow

## Inspect the actual chain

1. Resolve composed Controller mappings, context path, profile-specific configuration and gateway prefixes from local evidence. Keep generated/stale OpenAPI discrepancies visible.
2. Resolve the matching `SecurityFilterChain`, its `@Order`, `securityMatcher`, request matchers and fallback. A `permitAll` path may be intentionally public. A fallback chain may differ from the chain being reviewed.
3. Confirm method security is enabled and the invoked method passes through the enforcement boundary. An annotation alone is not proof; self-invocation, a different implementation and disabled method security matter.
4. Trace the authenticated principal and business organization to repository/service predicates. A user-supplied organization ID is not the same as a server-validated membership. Authentication does not establish access to every returned object.
5. Inspect pagination, list/detail/download variants and serialized fields. A list response may leak a field that detail authorization protects. Check role/function permissions and response-field policy independently.
6. Separate application authentication, object authorization, network reachability and external exposure. CORS and client-side hidden buttons do not enforce server authorization. An internal successful request cannot prove an external route is reachable.

## Choose bounded cases

| 차원 | 필요한 증거 | 미확정 처리 |
|---|---|---|
| 익명 | 같은 경로·객체에서 익명과 정상 계정 응답의 차이 | 공개 정책 미확인 시 unknown |
| 같은 역할의 타인 | 서로 다른 신원 교정과 제공된 합성 객체 소유권 | B 계정이 실제로 A 계정이면 unknown |
| 다른 조직 | 테스트 계정의 서버 측 조직과 테스트 객체의 조직 | 헤더로 적은 조직만 있으면 unknown |
| 하위 역할 | 명시된 업무 권한과 인증 계정 역할 | 권한 정책 없으면 unknown |
| 응답 필드 | 보호할 필드의 동일 합성 마커를 owner baseline과 비교 | 필드 없음·로그인 HTML만으로 안전 확정 금지 |
| HTTP method/Content-Type | 실제 라우팅·바인딩 경로별 차이 | 변경 요청은 별도 샌드박스 검증 계획 |

Prefer a few high-value cases that reproduce the claimed boundary over broad spraying. Use only supplied test IDs. Keep failed calibration out of the vulnerability count. A negative response can be a lockout, wrong URL or expired credential rather than correct authorization; the positive same-object baseline helps distinguish these cases.

## Avoid unsupported evidence

- Label source patterns `suspected` or `unknown` until the relevant path and policy are established. Do not turn regex hits into confirmed vulnerabilities.
- Do not collect real customer documents, export full responses or include bearer tokens in terminal commands, reports, screenshots or chat. Have the existing environment supply the named credential values without printing them.
- Do not re-login, modify identities, create test data or obtain additional access as an implicit part of probing. If those are needed, finish the plan and state the missing capability.
- Use `unknown` for redirects, compression/body limits, wrong content type, parse failures and timeouts. Do not retry automatically.
- Report exact tested conditions and dates. `not-reproduced` does not mean the whole API or application is secure.

## Separate mutation scenarios

For PATCH/POST/PUT/DELETE, prepare a proposed isolated test with disposable records, expected before/after state, owner/role/org policy, bounded request count and restoration check. Keep it unexecuted unless that sandbox mutation task is explicitly authorized. The supplied runner never sends such methods, even when the manifest says side-effect-free.

For a JSON Patch property-boundary investigation, verify that Spring Data REST is actually exposed and the relevant properties are visible to Jackson before relating it to an advisory. Do not apply a Spring Data REST advisory to every ordinary Spring MVC controller.
