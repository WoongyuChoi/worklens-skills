# Source register and refresh notes

Research cutoff: **2026-11-03**. These are independently structured facts, not copied publisher text or third-party scanner rules. The JSON preserves conditions and branch-specific fixes. Raw page bodies are not redistributed; no body SHA-256 is claimed.

| Record | Publisher date | Primary source | Purpose |
| --- | --- | --- | --- |
| CVE-2026-47849 | 2026-08-20 | https://spring.io/security/cve-2026-47849/ | Distinguish exposed Data REST JSON Patch and mutable Id/Version from generic JPA |
| CVE-2026-59280 | 2026-08-20 | https://spring.io/security/cve-2026-59280/ | Require FreeMarker, input-derived view name and SpringTemplateLoader together |
| CVE-2026-59270 | 2026-08-20 | https://spring.io/security/cve-2026-59270/ | Require embedded UnboundID use and reachable listener |
| CVE-2026-47841 | 2026-08-20 | https://spring.io/security/cve-2026-47841/ | Require passkey REQUIRED verification and serialized distributed sessions |
| CVE-2026-47852 | 2026-08-20 | https://spring.io/security/cve-2026-47852/ | Require Spring AI ONNX cache loading and local shared-host write conditions |
| CVE-2026-23864 | 2026-01-26; article 2025-12-11 | https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components | Historical amended-patch example; not a last-90-days incident |

## Amendment and normalization decisions

The React page's updated warning includes 19.1.4 among incomplete prior patches, but its enumerated affected list stops at 19.1.3. Preserve that conflict and return unknown for 19.1.4. The stated fixes are 19.0.4, 19.1.5 and 19.2.4. Related older DoS CVEs are not aliases of this later CVE. No exploit payload is included.

Spring publishes product-level ranges. Do not invent artifact mappings. Local evidence must establish the affected product implementation and exact version. Preserve qualified legacy ranges without stripping suffixes. Retain fix channels: enterprise-only does not imply public registry or company-mirror availability.

Spring AI's description requires a local attacker on a shared host, whereas the linked CVSS vector contains AV:N. Preserve this metadata ambiguity; apply the stated local conditions rather than classifying network exploitability from the score link alone. Qwen Agent presence does not prove Spring AI is used.

## Contemporary supply-chain data handling

GitHub's 2026-08-06 engineering article describes malware advisory ingestion across eight ecosystems and handling of withdrawn reports, differing version representations, duplicates and upstream provenance. Carry those controls into offline imports. Runtime non-use cannot rule out installation/build effects.

- https://github.blog/security/supply-chain-security/how-we-took-malware-advisories-beyond-npm/

OSV schema v1.9.2 (2026-10-13) documents modified/withdrawn/aliases and ecosystem-dependent version interpretation. Its fields informed preservation, but this helper does not implement a general OSV evaluator.

- https://ossf.github.io/osv-schema/

## Refresh without runtime internet

Verify source updates in the organization's authorized connected import process, then bring the reviewed snapshot into the intranet. Preserve record identities/dates, update withdrawals/aliases, record conflicts, and verify package mappings and patch availability. Do not declare a record current merely by changing collectedAt.

At use-time, compare supplied local snapshots. State narrow/old coverage. Do not run online package audits, upload dependency graphs, claim KEV inclusion without a preserved catalog record, or turn advisory text into an exploitation command.
