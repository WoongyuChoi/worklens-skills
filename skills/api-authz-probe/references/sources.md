# Upstream context

Use these as primary-source research references, not copied implementation or proof that a local application is affected. Retrieval date: **2026-11-03**. All bundled runner code and workflows are original.

| 자료 | 발표일 | 적용 의미 |
|---|---|---|
| [Spring Data REST CVE-2026-47849](https://spring.io/security/cve-2026-47849/) | 2026-08-20 | Spring Data REST repository + Jackson-visible `@Id`/`@Version` + JSON Patch 경로에서 객체 속성 보호 차이. 일반 Controller 전체 영향 아님. 인증 사용자도 타인 객체에 영향을 줄 수 있어 role/object/property/method 검사를 분리해야 함. 변경 재현은 이 GET/HEAD 러너의 실행 범위 밖임. |
| [Spring Security CVE-2026-59270](https://spring.io/security/cve-2026-59270/) | 2026-08-20 | 실제 embedded `UnboundIdContainer` 또는 `spring.ldap.embedded.*` 사용과 해당 리스너의 네트워크 도달 가능성이 전제. 단순 라이브러리 존재로 외부 노출을 단정하지 않음. 이 HTTP 러너는 LDAP 검사기가 아님. |
| [OWASP API1:2023 BOLA](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/) | 2023판 | 객체 ID 종류와 무관하게 해당 행위에 대한 객체 권한이 필요하다는 기준. 최신 사건 자료가 아닌 유지할 기본 기준. |
| [OWASP API Security Project](https://owasp.org/projects/api-security-project) | 2023판 | 객체·속성·기능 권한과 인증을 구분하는 기준. 무인증 검사만으로 충분하지 않음. |
| [OWASP ASVS 5.0.0](https://asvs.owasp.org/) | 2025-05-30 | 검증 요구사항과 출처 버전을 고정할 기준. 특정 제품의 취약 판정 근거로 대체하지 않음. |

For CVE applicability, obtain the actual runtime component version, feature/configuration evidence and relevant input/permission path. Record the original advisory URL and publication date. Keep inferred applicability separate from a matching version. Do not imply the local demo reproduces a vendor CVE: it demonstrates application-level authorization mistakes and bounded evidence handling.
