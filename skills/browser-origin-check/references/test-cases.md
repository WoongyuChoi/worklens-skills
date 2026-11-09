# Browser-origin case selection

Choose from actual application channels. Keep response readability, server-side effects and WebSocket admission as separate assertions. Do not equate a successful test of an isolated policy function with an observed browser result.

## Case matrix

| Boundary | Bounded case | Required observation | Normal control |
| --- | --- | --- | --- |
| Credentialed response read | Fetch a synthetic protected record from another approved test origin | Browser canary visibility, credential mode and target's response headers | Legitimate origin reads its own canary |
| Simple state change | Submit a small form-compatible or `text/plain` request using an existing synthetic session | State before/after, even if the browser cannot read the response | Legitimate state change remains possible |
| Preflighted state change | Change request shape only when the API supports it | Whether preflight and actual request occurred; state afterward | Normal API client shape works |
| WebSocket upgrade | Connect to a known synthetic channel from each origin | Browser open/message/error and server upgrade decision | Legitimate origin receives its canary |
| Origin policy variants | Exact trusted tuple, wrong port, lookalike host, literal `null`, missing Origin | Correct parser/policy decision and supported client contract | An explicitly permitted tuple succeeds |
| Cookie assumptions | Inspect actual cookie attributes and browser delivery for the tested sites | Browser version, initiator/target site, method and context | Normal authenticated flow |
| Shared-cache interaction | Alternate origins only if the real cache is in scope | Effective cache key and preserved `Vary` dimensions; no other user's data | Existing content negotiation still works |
| postMessage receiver | Send a harmless structured marker from known frames if present | `event.origin`, relevant `event.source`, data shape and actual privileged effect | Trusted sender works |

## Keep the browser in the experiment

Use an available browser with normal web security enabled. Start a fresh context, establish only synthetic credentials and navigate to each controlled test origin before running browser actions. Do not inject headers that normal page JavaScript cannot set and then describe the result as a browser exploit.

Avoid `file:` or `data:` test pages unless intentionally studying an opaque origin. Their Origin and storage behavior differ from an ordinary web page. A two-port loopback fixture is often enough for the read/effect/socket distinction, but its same-site limits must be stated.

Check the final state after asynchronous operations settle using explicit completion or state observation, not a guessed sleep alone. A browser `TypeError` can arise from CORS, TLS, connectivity, LNA or another policy; preserve the server observation needed to tell them apart. Do not label a timeout as a successful denial.

When a browser is unavailable, use an inspected existing local request tool or policy-function test and label it `서버 정책 시험`. Do not infer cookie delivery, SameSite enforcement, fetch readability or WebSocket behavior from that result.

## CORS and mutation reasoning

CORS controls whether page JavaScript may read a cross-origin response. Some requests can be sent without a preflight. Therefore the pair “response unreadable” and “server state changed” is possible and must be tested separately. A failed preflight only establishes what happened for that method/header/content-type combination.

Apply the application's supported CSRF defenses to authenticated mutations and verify that the accepted origin/request contract is preserved. Do not blanket-reject all missing-Origin traffic without considering authenticated machine clients, and do not allow missing-Origin traffic without independent protection. Keep redirects and different content types visible in the test record when they are relevant.

Add `Origin` to `Vary` without discarding existing dimensions when the response really varies by origin. A correct header on an uncached response alone does not establish a deployed cache's isolation.

## WebSocket and messaging reasoning

Check the upgrade handler separately from HTTP CORS middleware. Require both the intended origin policy and appropriate authentication; neither replaces the other. Test only the existing channel and a harmless canary. Per-message authorization, session revocation and downstream tool permissions remain separate assertions.

For `postMessage`, inspect exact sender origin, the expected sender window where needed and validated message structure before observing a privileged effect. A logged message alone is not proof of authority misuse. Avoid broad `*` targeting for sensitive outgoing data.

## Local-network and SameSite limits

`http://127.0.0.1:port-A` and `http://127.0.0.1:port-B` are cross-origin, same-site and both loopback. A cookie is not isolated by port. This arrangement does not prove cross-site cookie behavior, public-to-local/loopback permission behavior or DNS rebinding resistance.

For LNA, record actual browser support, secure context, initiating/target address spaces, permission state and enterprise policy. If these are not present, leave that assertion `미실행`. Do not disable browser security, add legacy PNA headers, or turn a localhost result into a claim of private-network protection.

## Retest record

Keep one row for the identical before/after action, one different nearby request/origin case and one legitimate control. Report browser readability and server effects in different columns. If an original defect is reproduced only at the server API level, retain that evidence level after the patch rather than upgrading it without a browser run.

Useful Korean limitation: “이번 실험은 서로 다른 두 loopback 포트의 cross-origin 동작입니다. SameSite 교차 사이트 차단과 LNA의 public→local 권한은 검증하지 않았습니다.”
