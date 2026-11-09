# Offline advisory triage contract

## Input discovery

Use existing dependencyInsight/dependencies output, dependency locks, package-lock.json, bundled-library inventories and observed class origins. Preserve module/configuration and export time. A requested range is not a selected version; a lockfile is not necessarily today's deployed files. Do not infer dependency versions from Spring Boot.

Create JSON as an agent work product. Do not make a short request depend on the user writing JSON. When decisive data is missing, report what can be checked and request one existing relevant export.

## Input fields

Root schema: `worklens-dependency-input/v1`.

| Field | Meaning |
| --- | --- |
| `project`, `title` | Scope and report title; label demos explicitly |
| `scope` | Optional description, string targets[], vantage, string limitations[] |
| `maxSnapshotAgeDays` | Optional age flag, default 90; not an online freshness check |
| `dependencies[]` | Exact dependency records |
| `assessments[]` | Condition evidence and optional already-captured runtime outcomes |

Each dependency requires `id`, `ecosystem`, `name`, `version`, `basis` and useful `evidence[]`. Basis is `declared`, `selected`, `packaged` or `runtime`; retain `configuration` when known. Each evidence item has `kind` (source/runtime/trace/advisory), `location` and `detail`. Anchor an actual supplied artifact. An advisory URL cannot prove a local dependency or configuration.

Use `productCandidates: ["spring-framework"]` for an unverified hint. To establish the product relation, add:

```json
{
  "productEvidence": [{
    "product": "spring-framework",
    "version": "6.1.1",
    "evidence": [{
      "kind": "source",
      "location": "runtime-inventory.txt:18",
      "detail": "선택된 spring-context-support의 버전과 Spring Framework 제품 귀속을 자료에서 확인함"
    }]
  }]
}
```

Use the dependency's exact version. A different product version is not an override. Product evidence must establish the affected implementation, not repeat a guessed prefix. The Spring records intentionally have no automatic Maven artifact mapping. Prefixes only produce PRODUCT_CANDIDATE. React's three exact RSC package mappings are directly publisher-listed.

Each assessment has `dependencyId`, `advisoryId`, `conditions` and optional `runtime`. Condition keys match advisory condition IDs. Example condition value:

```json
{
  "value": false,
  "evidence": [{
    "kind": "source",
    "location": "deployment/static-client.md:7",
    "detail": "이 배포는 정적 자산만 제공하며 React 서버 런타임을 포함하지 않음"
  }]
}
```

Use `"unknown"` when evidence is absent. Booleans without local evidence become unknown. The string `"false"` is not a boolean. Missing search matches, unused imports or a flag's default do not prove a deployed negative. Scope rebuttals to deployment/profile/time.

`runtime` may contain `outcome: "reproduced"` or `"not-reproduced"` and evidence of kind runtime. These are already-captured records. The helper neither generates nor independently authenticates them and never contacts the service. Explain measured scope/outcome in detail; source review is not runtime evidence.

## Version comparison limits

- Match explicit numeric versions exactly, or numeric major.minor.patch in inclusive from/through ranges and known branches.
- Accept numeric four-part versions only for listed equality. Do not order them against triplets.
- Leave .RELEASE, .Final, -SNAPSHOT, prereleases, build metadata, leading v, wildcard/request ranges, unsupported integer sizes and other formats unknown. Do not strip suffixes.
- Leave omitted branches unknown, even if a newer branch has a fix. A current announcement can omit an old unsupported branch.
- Preserve unparsed statements. `5.2.25.RELEASE and earlier` is not converted to numeric ordering; the Data REST statement about `3.7.20 and earlier` does not establish every older branch in this limited helper.
- Exact fixed versions and numeric versions at/after a same-branch numeric fix are outside this specific advisory's known affected range. That is not a statement about every vulnerability.
- Preserve conflicts: RSC 19.1.4 remains unknown because its patch warning and version enumeration differ.
- Retain OSS/enterprise-only/vendor-only/unknown fix channels. Availability does not establish repository access or entitlement.

This is not a general OSV, SemVer or Maven evaluator. Direct OSV ingestion, arbitrary version resolution and online updates are outside this helper.

## State and evidence rules

| triageState | Interpretation | Report status |
| --- | --- | --- |
| VERSION_MATCH | Version is in range; prerequisites not assessed yet | unknown |
| REACHABILITY_UNKNOWN | Version matches; condition evidence is incomplete | unknown |
| AFFECTED | All required static conditions have evidence | suspected; confirmed only with supplied runtime reproduction |
| REACHABILITY_REBUTTED | Required condition is false with scoped evidence | not-applicable |
| PRODUCT_CANDIDATE | Product identity has not been established | unknown |
| UNPROVEN_DEPENDENCY | Declaration only or no local selected-version evidence | unknown |
| VERSION_UNKNOWN | Unsupported format, unlisted version or unverified branch | unknown |
| VERSION_OUTSIDE_KNOWN_RANGE | Exact/same-branch fix covers the version | not-applicable for this advisory |
| ADVISORY_WITHDRAWN | The source record was withdrawn | not-applicable; preserve history |
| ADVISORY_CONFLICT | Aliased records/assessments or source version statements disagree | unknown |
| EVIDENCE_CONFLICT | Supplied runtime reproduction contradicts a static rebuttal, fix or withdrawal | unknown |

Conditions are conjunctive: all are needed for static AFFECTED; one evidenced false prerequisite can rebut scoped applicability. For malware, runtime-call absence cannot rebut installation/build effects. The helper only accepts false install/build prerequisites as malware rebuttals; otherwise retain unknown and request installation/build evidence.

If runtime checks did not reproduce an issue, retain AFFECTED when static conditions still hold, with status not-reproduced. Describe measured coverage; do not relabel fixed or unaffected.

## Snapshot and report integrity

Preserve publishedAt, actual modifiedAt (null if unavailable), withdrawnAt, source retrievedAt and snapshot collectedAt. Do not guess a modification date. Add source-content SHA-256 only after retaining/hashing the actual source body. This bundle includes no raw page bodies and claims no source hashes.

Deduplicate identity aliases, not related/upstream/downstream CVEs. Hold conflicting version conditions, withdrawal or fix records instead of selecting a convenient alias. A withdrawn source and an active alias require reconciliation.

Output is worklens-security-report/v1, mode static: the helper reads observations and runs no active checks. Keep extra triageState, versionMatch, conditionEvidence, dependency basis, availableFixes, dates and provenance in JSON. Common evidence also contains condition anchors for the Markdown report. Critical publisher severity is mapped to high in the four-level display and retained in advisorySeverity.

No matching entry means this curated snapshot did not cover the dependency. Without Node, apply this contract manually using the template. Unknown states and the next decisive checks remain useful deliverables.

## 실행 근거가 반입된 보고서

정적 조건만 판정하면 mode=static입니다. 제공된 runtime 기록을 근거로 confirmed/not-reproduced를 기록한 보고서는 mode=evidence-review로 구분합니다. 이 분석기가 직접 실행했다는 뜻이 아닙니다. JSON·Markdown에 제공된 근거의 위치와 한계를 함께 남깁니다.
