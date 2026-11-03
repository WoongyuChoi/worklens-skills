# Primary research and scope

Reviewed **2026-11-03**. These references guide the workflow; they do not require an OpenTelemetry installation and do not prove the local business classification or policy.

| 자료 | 날짜 구분 | 적용 의미 |
|---|---|---|
| [OpenTelemetry — Handling sensitive data](https://opentelemetry.io/docs/security/handling-sensitive-data/) | 현재 공식 가이드, 열람 2026-11-03 | 도구만으로 업무별 민감도를 자동 결정할 수 없음. 관측 목적에 필요한 최소 수집과 불필요 수집 제외를 우선. 제한된 값 공간의 해시도 익명성을 보장하지 않음. |
| [Applying OpenTelemetry Security Practices in Legacy Environments](https://opentelemetry.io/blog/2026/security-legacy-environments/) | 발표 2026-05-19 | 레거시 환경에서 민감한 상세 데이터와 payload 수집을 줄이는 운영 관점. 최근 90일 취약점 공지로 표시하지 않음. |
| [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) | 유지되는 기본 기준, 열람 2026-11-03 | 토큰·비밀번호·민감한 개인 데이터를 직접 기록하지 않도록 검토하되 보안 사건과 상관관계 정보를 보존. 필드가 부적절할 때 전체 사건을 버리는 방식은 피함. |

Use source and policy evidence to decide whether a field is unnecessary, required or unresolved. Do not present the research as a blanket prohibition on all logging. Do not invent retention periods or legal conclusions. The bundled code and instructions are original; no upstream implementation is copied.
