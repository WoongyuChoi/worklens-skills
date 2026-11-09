# Runner manifest and evidence contract

## Input and approval

Use JSON with `schema: "worklens-api-probe/v1"`. Follow `assets/manifest.example.json`; unknown fields are rejected. Create the draft from the current project and user context. Do not require a user-authored complete manifest before inspecting sources.

Set `mode` to `authorized-live` for an approved real target, or `local-demo` for an isolated numeric-loopback demonstration. `scope.authorizationConfirmed` records user authorization; the boolean is not itself proof of permission. Leave it `false` when the task only authorizes research or the target is unresolved. `--plan` works without approval. `--execute` requires explicit approval recorded as `true`.

Scope fields:

- `origin`: exact canonical HTTP(S) origin, without credentials, a path, query or trailing slash.
- `vantage`: `loopback`, `internal`, `external` or `unknown`, based on actual host context. This is a claimed test vantage, not a network reachability measurement.
- `description`: optional short planning context. The runner deliberately does not copy arbitrary free text into runtime evidence.

Keep a source inventory even for APIs that cannot be put into an executable manifest yet. The report denominator is the listed manifest cases, not all API routes in the repository.

## Exact target boundaries

Each `calibrations` and `routes` entry declares a globally unique safe `id`, uppercase `method`, full exact `path` including query, `sideEffectFreeConfirmed`, and its `cases`. No dynamic URL templates, wildcards, path enumeration, overrides or cross-origin URL fields exist. Ambiguous encoding, dot-segment normalization, fragments, backslashes and protocol-relative paths are rejected.

Only GET/HEAD entries whose absence of business side effects is confirmed by user context run. HTTP semantics alone are not proof that a logout/export/job-trigger endpoint has no effects. Other methods remain in coverage as `skipped`. A gateway URL and a backend URL are different origins and need separate manifests/runs.

Optional `source: {"path":"src/.../Controller.java","line":42}` must be a secret-free project-relative location. It is an author-supplied reference; the runner does not parse or verify the source. Optional `policyNote` records planning rationale and is not treated as an instruction or copied to evidence.

## Identity and synthetic markers

Define exactly one anonymous principal and at least one authenticated principal. Give authenticated principals a credential **environment-variable name**, never a token or cookie value:

```json
{"id":"owner-a","kind":"authenticated","credential":{"header":"Authorization","env":"WL_OWNER_AUTH"}}
```

The variable contains the complete header value, supplied through the existing approved environment. The supported headers are `Authorization`, `Cookie` and `X-API-Key`. The runner does not accept arbitrary headers, generate credentials, maintain a cookie jar, store returned cookies or print values. Missing/invalid variables leave related cases `unknown`. Planning does not read them.

Calibration must contain an anonymous-denied check and a successful identity check for every authenticated principal. Use a known side-effect-free endpoint that returns the test principal's distinct synthetic identity; the same marker cannot represent two different principals. Do not assert that an arbitrary token belongs to a user without verifying it. If the application cannot supply such an identity signal, keep dynamic confirmation unavailable and explain the missing fixture.

Each business route names an authenticated allowed `baselineCaseId`. Supply a `marker` from known synthetic data, such as:

```json
{"pointer":"/record/testTag","equals":"WL_SYNTHETIC_RECORD_A"}
```

Use a literal string beginning with `WL_SYNTHETIC_` in a supplied disposable fixture. Do not use real identifiers or personal data as markers. JSON pointer comparison uses exact strings without numeric conversion. For HEAD only, an intentionally provided test endpoint may expose `{"header":"x-worklens-synthetic-marker","equals":"WL_SYNTHETIC_RECORD_A"}`. Normal HEAD with no marker cannot establish a data disclosure.

Every case has `id`, `principal`, `expect` (`allow`, `deny`, `unknown`) and `policyConfirmed`. Denied cases may declare `deniedStatuses`, limited to 401/403/404; defaults are 401/403. A denied case needs the **same marker location and value as the owner baseline** to confirm a leak. Without a marker, a real denied response can establish `not-reproduced`, but a 200 cannot confirm a vulnerability. Policy-unknown cases do not execute.

The same full path is used for all cases in a route: the legitimate owner and other principals request the same supplied synthetic object. Create another route entry for another supplied object ID. Do not enumerate unknown objects.

## Limits and result semantics

| 옵션 | 기본값 | 허용 범위 |
|---|---:|---:|
| `maxRequests` | 30 | 1–100 |
| `minIntervalMs` | 500 | 100–10,000 |
| `timeoutMs` | 3,000 | 100–30,000 |
| `maxBodyBytes` | 32,768 | 256–262,144 |
| `maxDurationMs` | 60,000 | 100–300,000 |

Count calibration and baseline requests in the total budget. Run sequentially, one attempt per listed case. Apply timeout to DNS/connection/TLS/body streaming together. Stop a response when the body budget is exceeded; do not decompress responses or parse an unlimited body. Set `Accept-Encoding: identity`; unexpected compressed/non-JSON content cannot produce a JSON marker match.

Use direct standard-library HTTP(S), `agent:false`, explicit TLS verification and no proxy lookup. Do not unset the host's proxy globally. If the authorized endpoint is reachable only through a corporate proxy, this runner cannot execute that environment as written: retain a plan and state the limitation. Do not silently route credentials through ambient proxies. No redirects or retries occur.

Report `worklens-security-report/v1` with Korean text, runtime observations and coverage. Emit no body values, response header values, credentials, tokens, cookies, marker values, raw request paths/queries or unfiltered exception messages. Identify cases using safe manifest IDs. Record status, bounded bytes, content category and whether a marker matched; keep semantic evidence rather than sensitive raw responses.

- `confirmed`: relevant calibration and positive owner baseline succeeded, denied policy is confirmed, and the same synthetic marker was observed dynamically.
- `not-reproduced`: a declared denial status was observed without the marker for that test case.
- `unknown`: unresolved policy, calibration, credential, baseline, marker, redirect, network/TLS, timeout or body limit.
- Coverage `tested`: a listed case reached a supported decision; `skipped`: deliberately excluded/budget-limited; `unknown`: unresolved or inconclusive. Every listed calibration and business case stays in the denominator. The summary separately states actual HTTP request count.

## Runtime commands and fallback

```text
node scripts/probe.cjs --manifest manifest.json --plan --out api-plan.json
node scripts/probe.cjs --manifest manifest.json --execute --out api-report.json
node scripts/write-report.cjs api-report.json api-report.md
node scripts/demo.cjs --out-dir api-demo-results
```

The default action is `--plan`. Output files must be new. Keep credential provisioning out of transcripts and manifest files. Do not put token values directly in a shell command. The demo uses only its own synthetic in-memory identities.

When no suitable shell/HTTP capability exists, deliver a static source-policy matrix, a draft manifest, a non-executed test procedure and `unknown` runtime coverage. Do not install Node, a scanner or dependencies just to avoid stating this limitation. Write a finished Markdown report using `references/report-blueprint.md`; no viewer, server or user-prepared JSON is needed.
