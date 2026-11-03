# Bounded local log checker

## What the checker establishes

Use `scripts/check-logs.cjs` as an evidence helper after source/policy review. It is not a Java dataflow analyzer, a business PII classifier, a de-identification tool or a collector. It reads only the named local file and does not use the network.

The report includes configured field IDs, limited line numbers and aggregate counts. It does not include raw records, values, partial values, hashes, input filenames, full input paths or unfiltered parser/OS exception text. Do not place real values or operational paths in the chosen safe `--label`, field IDs or policy-source metadata either.

## Rule format

Use `schema: "worklens-privacy-policy/v1"` and adapt `assets/field-policy.example.json`.

- `fields`: maximum 128 fields. Each has safe `id`, `classification` (`personal`, `sensitive`, `credential`, `candidate`), `decision` (`exclude`, `review`, `allow`), `policyConfirmed`, explicit `jsonPointers` and/or `kvKeys`.
- `policySource`: a project-relative path and positive line number. Require actual evidence before setting any field's policy to confirmed. A supplied source location is an author claim; the checker does not verify the document's meaning.
- `requiredFields`: approved diagnostic fields, each with `id`, selectors and `type` (`string`, `number`, `any`). Configure the actual event requirements; do not assume all applications always need identical fields.
- `canaries`: optional `{field, value}` pairs with unique literal `WL_SYNTHETIC_...` values only. Do not supply real personal values or secrets here. Canary matches find known synthetic data even inside a serialized DTO/error-message string.
- `limits`: input and evidence limits described below. No arbitrary user regex is executed.

Use exact JSON pointers; `*` matches array elements only. Distinguish `/customer/name` from an unrelated `/service/name`. Map aliases explicitly from the current source. `kvKeys` are exact case-sensitive keys, not wildcard searches. Unknown fields are outside configured coverage; never report that all personal data has been found.

Keep null/empty or approved marker representations (`[REDACTED]`, `[REMOVED]`, `***`) separate from a nonempty raw representation. An excluded field that remains as a masked/null key is still present in the output; do not count it as removed. A field shape does not establish whether the value identifies a real person.

## Supported inputs

**JSONL:** one complete UTF-8 JSON object per physical line. Handle nested objects, explicitly selected array paths and strings containing escaped JSON. Treat duplicate keys, invalid UTF-8, non-object records, multiline JSON/stack traces and excessive structures as `unknown`. Do not join lines or guess a multiline format.

**KV:** an entire line of whitespace-separated `key=value` pairs. Keys follow identifier syntax. Values are bare non-whitespace tokens or JSON double-quoted strings. Timestamp/level prefixes, single-quoted values, duplicate keys, arbitrary delimiters and multiline records are unsupported. Preserve unknown counts rather than silently skipping these lines. Define a local adapter only after the actual format is known and test it separately; do not transform or print a real raw log here.

Blank lines are counted separately. Do not claim a successful regression from an empty file. The scanner neither decompresses input nor parses arbitrary binary encodings.

## Bounds

| 옵션 | 기본값 | 최대 |
|---|---:|---:|
| `maxBytes` | 10 MiB | 100 MiB |
| `maxLineBytes` | 64 KiB | 1 MiB |
| `maxLines` | 50,000 | 1,000,000 |
| `maxDepth` | 12 | 32 |
| `maxNodesPerLine` | 2,048 | 10,000 |
| `maxEvidenceLines` | 20 | 50 |

Read in bounded chunks and cap each stored line. Stop at the byte/line budget. A file that changes during the read, or has unread remaining data, stays incomplete. Report observed physical/parsed/blank/unknown lines and completeness; the number of unread lines is unknown. Keep totals even when the list of evidence line numbers is capped. Maximum evidence-line count is not a cap on total occurrence counts.

## Classification and interpretation

- Use `evidence-review` for supplied execution logs. `confirmed` means that a confirmed exclusion policy and nonempty field/canary occurrence were observed in that file. It does not prove current production behavior, actual personal identity, external exposure or a new service execution.
- Use `local-demo` only for the bundled script's newly emitted synthetic before/after logs. The local demonstration proves this helper and this synthetic emission behavior, not the company's logger/collector integrations.
- Keep unconfirmed business classification and masked/empty-only occurrences as `suspected`. Keep unsupported or truncated coverage `unknown`.
- Treat required-field absence as a separate observability issue. Removing all logging must not pass as a privacy fix.
- Combine source removal evidence with a representative covered regression. Sampled absence alone is insufficient.

## Commands

```text
node scripts/check-logs.cjs --rules field-policy.json --input approved-local.jsonl --format jsonl --label service-a --out log-report.json
node scripts/render-report.cjs log-report.json log-report.html
node scripts/demo.cjs --out-dir privacy-demo-results
node scripts/render-report.cjs privacy-demo-results/reports.json privacy-demo-results/report.html
```

Use a new output path. The CLI reserves it before reading the log, refuses overwrite and emits only counts. Keep the original input unchanged. Without a shell/Node capability, deliver the source analysis, rule draft and unexecuted local procedure; do not ask for a production-log upload or install dependencies.
