# Recent source-review anchors

Snapshot retrieved on **2026-11-03**. Use these primary advisories to ask precise source questions. Do not infer applicability from a dependency name or from the bundled demo. Determine the installed artifact separately; a declared version alone may differ from the deployed one. These independent summaries do not contain vendor payloads or copied implementation code.

## Spring Data JPA — CVE-2026-47834

- Official source: <https://spring.io/security/cve-2026-47834/>
- Published: **2026-08-20**; vendor severity: Medium.
- Trace untrusted `Sort` input through the controller to a native repository method. The advisory requires native SQL (`@NativeQuery` or `@Query(nativeQuery=true)`), a `Sort`/`Pageable` parameter, missing prior sanitization, and a database that accepts non-ASCII characters in SQL syntax. All conditions matter.
- Inspect a finite application sort-key mapping before concluding that the framework's path is exposed. The vendor describes inference through sorting; do not claim unrestricted database extraction or identify a specific database as affected without evidence.
- Affected: 4.1.0; 4.0.0–4.0.6; 3.5.0–3.5.13; 3.0.0–3.4.15.
- OSS fixes: 4.1.1, 4.0.7. Enterprise branches include 4.1.0.1, 4.0.6.1, 3.5.14, 3.4.16.
- This skill's ASCII string-builder demo does **not** reproduce this CVE or test database parsing.

## Spring Cloud Gateway — CVE-2026-47879

- Official source: <https://spring.io/security/cve-2026-47879/>
- Published: **2026-08-20**; vendor severity: High.
- Trace who can set the proto descriptor used by `JsonToGrpcGatewayFilterFactory`, and how that value reaches a Spring Resource loader. The advisory's CVSS vector requires high privileges (`PR:H`); do not label a Gateway dependency as an anonymously reachable SSRF.
- Affected: 5.0.0–5.0.2; 4.3.0–4.3.5; 4.0.0–4.2.9; 3.1.13 and earlier. OSS fix: 5.0.3. Enterprise fixes: 4.3.6, 4.2.10, 3.1.14.
- For file resources, the vendor also requires valid descriptor prefixes: `spring.cloud.gateway.server.webflux.json-to-grpc.valid-proto-descriptor-prefixes` on 5.0/4.3, or `spring.cloud.gateway.json-to-grpc.valid-proto-descriptor-prefixes` on 4.2/3.1.
- Verify the deployed binding and effective resource policy. A constructed URL alone does not prove a resource was fetched. The bundled URL plan uses no Spring code and makes no request.

## Spring Framework FreeMarker — CVE-2026-59280

- Official source: <https://spring.io/security/cve-2026-59280/>
- Published: **2026-08-20**; vendor severity: Medium.
- Trace controller input into the returned view name, then through FreeMarker configuration to `SpringTemplateLoader`. Input-controlled view names and that loader are necessary context; ordinary untrusted template data is a different path.
- The advisory explicitly excludes applications whose returned view names are not derived from untrusted input. Verify this fact across the actual callers rather than assuming it from a naming convention.
- Affected: 7.0.0–7.0.8; 6.2.0–6.2.19; 6.1.0–6.1.28; 6.0.0–6.0.30; 5.3.0–5.3.49; 5.2.25.RELEASE and earlier. OSS fix: 7.0.9. Enterprise fixes: 7.0.8.1, 6.2.20, 6.1.29, 6.0.31, 5.3.50, 5.2.26.
- The bundled Node path example does not reproduce Spring's platform-specific loader behavior. Prefer source/configuration evidence and a permitted isolated framework test where available.

## Workflow provenance

Use source evidence, actual reachability and independent control checks as general review practices. The instructions, fixture and local runner here are original Worklens material. No upstream SKILL.md, PDF or scanner is bundled.

- Trail of Bits triage reference, pinned file commit **2026-09-01**: <https://github.com/trailofbits/skills/blob/b89f6dbc3565c9e3e8990b3a837991d25d76633e/plugins/vulnerability-triage-brocards/skills/vulnerability-triage-brocards/SKILL.md>. Upstream license: CC-BY-SA-4.0. Consulted for evidence/triage concepts; do not copy its dismissal rules into an application decision automatically.
- OpenAI security-scan reference, pinned file commit **2026-10-08**: <https://github.com/openai/plugins/blob/0722921d5542fc593105c27bd52630babd8b8c2a/plugins/codex-security/skills/security-scan/SKILL.md>. The plugin manifest declares **Proprietary**; only general review concepts were consulted. Its runtime and instructions are not incorporated.
- OWASP GenAI Red Teaming Manual 1.0, **2026-10-20**: <https://genai.owasp.org/resource/genai-red-teaming-manual-version-1-0/>. Upstream document: CC-BY-SA-4.0. Consulted for explicit test outcomes, reproducibility and evidence limits; no PDF content is redistributed.
