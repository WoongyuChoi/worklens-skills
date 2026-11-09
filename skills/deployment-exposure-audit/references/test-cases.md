# Bounded exposure cases

Choose cases from the inspected application and its policy. These are test-design lenses, not an endpoint wordlist or a claim that every application contains these weaknesses. Use synthetic values and the existing runtime. Do not copy a vendor CVE payload into an unrelated application.

## Evidence table

Use this human-facing shape for each selected boundary. Fill it from observations; do not prefill success.

| 사례 | 소스·실효 설정 근거 | 확인할 정책 | 변경 전 | 변경 후 | 남은 조건 |
|---|---|---|---|---|---|
| 일반 사용자 진입점 | 실제 프록시 규칙·정규화·대상 handler | 허용된 업무 응답만 반환 | 실행 결과 또는 미실행 | 동일 사례 결과 또는 미실행 | 외부 네트워크 도달성 등 |
| 같은 원인의 변형 | 별도로 발견한 handler·alias·오류 분기 | 같은 보안 경계 유지 | 실행 결과 또는 미실행 | 동일 사례 결과 또는 미실행 | 적용되지 않는 분기는 제외 |
| 정상 공개 기능 | 실제 health·업무 route | 필요한 최소 응답 유지 | 실행 결과 또는 미실행 | 동일 사례 결과 또는 미실행 | 상태 코드만으로 판단하지 않음 |
| 정상 운영 기능 | 의도된 운영 입구·인증 경로 | 운영 사용자의 정상 기능 유지 | 실행 결과 또는 미실행 | 동일 사례 결과 또는 미실행 | 계정·경로 부재 시 미확인 |

Keep the vulnerable source or equivalent file snapshot and the exact same assertion for comparison. For a read-only case, assert the absence of a protected synthetic marker on the ordinary entry point and its presence on the intended synthetic operator path. Do not turn real operational values into report evidence.

## Case selection

| Lens | What to derive from source | Minimal execution | Avoid a false conclusion |
|---|---|---|---|
| Proxy path rewriting | Incoming matcher, normalized path, rewrite target and authorization order | One discovered management handler through a public alias; another discovered handler as the root-cause variant | A direct denied path does not prove all translated routes are denied |
| Management port separation | Active listener address/port, transport exposure, proxy mapping and access policy | Request the stated path only from the approved vantage point | Separate port, loopback binding or a dependency name alone proves neither public exposure nor isolation |
| Header trust | Incoming-header removal, trusted immediate peers, generated identity/address and consuming guard | A synthetic header difference on one known route, only when source shows it affects the decision | A header echoed into logs is not evidence that authorization trusts it |
| Default or malformed value | Loader precedence, boolean/string parsing, empty/missing/invalid fallback, startup behavior | Start isolated local copies with one non-secret setting changed; use the same harmless request | A missing variable that prevents startup is fail-closed, not a running exposed service |
| Diagnostic surface | Registered path, activation profile, returned fields, cost and side effects | A small synthetic response that demonstrates the excessive field shape | Do not request real heap dumps, environment exports, shutdown or expensive metrics collection |
| Public error behavior | Actual routed exception handler and production/debug selection | One harmless invalid local input reaching the relevant error handler | Generic 500 is not a disclosure; absent sensitive data on one error does not cover all errors |
| Published files | Supplied file-serving rule, exact discovered artifact and mapping | Read one synthetic artifact already known from source/configuration | Do not enumerate backups, hidden paths or neighboring directories |

## Retest discipline

- Use the same security assertion before and after the patch. It should identify the intended management/business response rather than rely on an exact denial message.
- Ensure execution reached that assertion. A failed build, missing tool, timeout, response cap or refused connection is `확인 못 함`.
- Derive a variant from another call site or boundary sharing the cause. Changing a random character in a request is not independent coverage.
- Keep public health/business behavior and legitimate operator behavior as separate controls. A patch that makes everything return 404 has not preserved the service contract.
- Reuse equivalent settings and identities across revisions. If they changed, identify the confounder instead of attributing the result solely to the code patch.
- Keep findings and coverage gaps together. Incomplete verification can coexist with a well-supported exposure finding.
- When runtime tools are unavailable, provide a source-backed plan with exact known paths and missing requirements. Never turn a proposed request into an executed observation.

## Example conclusion wording

“로컬 합성 환경에서 사용자 진입점의 운영 응답 노출을 재현했습니다. 같은 사례와 같은 원인의 다른 경로를 수정 후 다시 확인했고, 공개 상태 조회와 의도된 운영 조회도 유지됐습니다. 사내 실제 프록시·방화벽 설정과 외부 접근 위치에서는 실행하지 않았으므로 외부 노출 여부는 확인하지 못했습니다.”

Use this wording only when the described checks actually ran. Replace missing checks with explicit gaps.
