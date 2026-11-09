# Worklens Skills

폐쇄망의 로컬 Agent가 소스를 살피고, 작은 재현으로 확인하고, 수정 후 같은 사례를 다시 검사하도록 만든 **스킬 50개**입니다. 카테고리 `40_security`에는 보안 스킬 10개가 있습니다.

실행 지침은 영어, 사용자 결과와 예시는 한국어입니다. Qwen을 포함한 여러 Agent에서 읽을 수 있는 Markdown 구조를 사용하며, 특정 제품의 도구 API를 가정하지 않습니다. 소스 검토에 인터넷·추가 패키지·Git·CI·DB를 요구하지 않습니다. 실제 실행에는 현재 프로젝트의 환경과 호스트 도구가 필요합니다.

## 이번 보안 5개

| 스킬 | 확인하는 문제 | 짧은 요청 |
|---|---|---|
| [session-lifecycle-check](skills/session-lifecycle-check/SKILL.md) | 로그아웃·회전·복구 이후 남는 증표 | 로그아웃한 세션과 예전 refresh token이 다시 통하는지 확인하고 고쳐줘 |
| [workflow-abuse-test](skills/workflow-abuse-test/SKILL.md) | 승인 순서 우회·재전송·동시 처리 | 승인 생략이나 동시 요청으로 중복 처리되는지 확인하고 고쳐줘 |
| [upload-lifecycle-test](skills/upload-lifecycle-test/SKILL.md) | 검사 누락·검사 전 공개·저장 경계 | 첨부파일이 검사 없이 공개되는 경로를 확인하고 고쳐줘 |
| [browser-origin-check](skills/browser-origin-check/SKILL.md) | CORS 읽기·CSRF 효과·WebSocket 출처 | 다른 웹 출처에서 데이터나 상태에 접근되는지 확인해줘 |
| [deployment-exposure-audit](skills/deployment-exposure-audit/SKILL.md) | 실제 profile·백엔드 우회·관리면 | 실제 배포에서 관리 경로나 우회 접근이 열리는지 확인하고 고쳐줘 |

[선정 이유와 최신 원자료](docs/SECURITY-RESEARCH-2026-11-09.md) · [사용 안내](docs/SECURITY-GUIDE.md) · [전체 목록](docs/CATALOG.md)

## 보고서를 받는 방법

보안 10개 모두 **완성된 Markdown 보고서가 기본**입니다. Agent가 근거, 수정 내용, 동일 사례·변형·정상 경로 재검증, 미확인 범위를 정리합니다. 사용자가 JSON을 만들거나 HTML에 업로드할 필요가 없습니다.

도식이나 발표용 HTML이 필요한 경우 각 폴더의 `references/report-blueprint.md`에 있는 **디자인 규칙과 전체 HTML 소스**를 참고해, 결과가 이미 들어간 단일 문서를 생성합니다. 별도 뷰어·CDN·외부 폰트가 없습니다. [보고서 규칙](docs/SECURITY-REPORT-FORMAT.md)

기존 보안 5개도 이 방식으로 변경했습니다. `assets/report.html`, `scripts/render-report.cjs`는 제거했습니다. 기존 선택형 검사 도구와 JSON 중간 결과는 유지하며, Node가 이미 있으면 `scripts/write-report.cjs`가 Markdown으로 변환합니다. 일반 스킬의 독립 HTML 도구 15개는 이번 변경 대상이 아닙니다.

## 사내 반영 상태

- 기존 1·2차 20개: 사내 반영 완료로 확인됨.
- 3차 20개: 구현 완료, 사내 반영 여부 추가 확인 전.
- 기존 보안 5개: **2026-11-09 채택·적용 결정**. 설치·실행 완료와 실무 성과는 별도 기록.
- 이번 보안 5개: 구현·로컬 검증, 사내 적용 전.

[사내 반영·사용 피드백](docs/ADOPTION.md)에서 상태를 구분합니다. 합성 프로젝트의 통과를 사내 Qwen이나 실제 서비스의 검사 완료로 표시하지 않습니다.

## 사용

1. 필요한 `skills/스킬이름`을 사내 Agent가 읽는 위치에 **폴더째** 복사합니다. 참조 자료도 함께 필요합니다.
2. 현재 프로젝트와 함께 위와 같은 짧은 요청을 전달합니다. 자동 선택이 불안정하면 스킬 이름을 명시합니다.
3. Agent는 기존 맥락과 소스부터 살피고, 실행 환경이 없으면 정적 근거와 정확한 미검증 항목을 남깁니다.

분류는 찾아보기용입니다. 사내 정리함에서는 `40_security`에 보관하고, 실제 로더 등록 위치는 사내 방식을 따르세요. 자체 수정한 기존 보안 스킬은 백업·비교 후 필요한 변경만 반영합니다. 덮어쓰기 복사로는 이전 HTML 파일이 자동 삭제되지 않습니다.

## 검증과 출처

[검증 기록](docs/VALIDATION.md) · [개발 검사](tests/README.md) · [출처와 독립 작성 범위](docs/SOURCES.md)

공개 스킬·공식 보안 공지의 절차와 사실을 참고하여 독립 작성했습니다. 외부 스캐너나 에이전트 플랫폼을 함께 설치하는 팩이 아닙니다. 라이선스는 [LICENSE](LICENSE)를 따릅니다.
