# 전체 스킬 목록

2026-11-03 · 기존 20개 사내 반영 완료 / 신규 20개 구현 완료·사내 확인 전

분류는 사내 정리함을 참고한 찾아보기용입니다. 실제 배포 폴더는 `skills/스킬이름`입니다.

## 00_common · 공통

| 스킬 | 짧은 요청 | 구분 |
|---|---|---|
| [파일 탐색](../skills/file-explorer/SKILL.md) `file-explorer` | 이 파일 좀 보기 좋게 | 기존 |
| [반복 작업 도구](../skills/task-to-tool/SKILL.md) `task-to-tool` | 방금 한 거 다음에도 쓰게 만들어줘 | 기존 |
| [일괄 처리](../skills/parallel-batch/SKILL.md) `parallel-batch` | 이 방식으로 나머지도 처리해줘 | 기존·추천 우선순위 낮음 |
| [다음 세션 인계](../skills/session-handoff/SKILL.md) `session-handoff` | 하던 작업 이어서 해줘 | 기존 |
| [프로젝트 규칙 기억](../skills/project-playbook/SKILL.md) `project-playbook` | 다음부터 이 프로젝트에서는 이렇게 해줘 | 기존 |
| [데이터 대조](../skills/data-reconcile/SKILL.md) `data-reconcile` | 이 두 파일 안 맞는 것만 찾아줘 | 기존 |
| [로그와 샘플 가명처리](../skills/sample-mask/SKILL.md) `sample-mask` | 식별정보 가려서 공유본 만들어줘 | 기존 |
| [한글·바이트 경계 진단](../skills/encoding-boundary/SKILL.md) `encoding-boundary` | 한글에서 전문 길이가 왜 안 맞는지 봐줘 | 신규 |
| [배치 일정 미리보기](../skills/schedule-lens/SKILL.md) `schedule-lens` | 이 배치들이 월말에 언제 겹치는지 보여줘 | 신규 |

## 10_design · 설계·화면 동작

| 스킬 | 짧은 요청 | 구분 |
|---|---|---|
| [화면 시안](../skills/screen-prototype/SKILL.md) `screen-prototype` | 이 기능 화면으로 보여줘 | 기존 |
| [기존 화면 다듬기](../skills/ui-polish/SKILL.md) `ui-polish` | 이 화면 좀 덜 답답하게 다듬어줘 | 기존 |
| [설계 대안 비교](../skills/design-decision/SKILL.md) `design-decision` | 이 책임을 어디에 둘지 현재 코드로 비교해줘 | 신규 |
| [키보드·포커스 점검](../skills/a11y-focus/SKILL.md) `a11y-focus` | 이 팝업과 트리를 키보드로 쓸 수 있게 봐줘 | 신규 |

## 20_dev · 개발·운영 진단

| 스킬 | 짧은 요청 | 구분 |
|---|---|---|
| [개발과 검증](../skills/dev-conductor/SKILL.md) `dev-conductor` | 이 기능 개발하고 QA까지 해줘 | 기존·추천 우선순위 낮음 |
| [환경설정 대조](../skills/config-compare/SKILL.md) `config-compare` | 개발이랑 운영 설정 다른 것만 보여줘 | 기존 |
| [API 변경 영향](../skills/api-change-impact/SKILL.md) `api-change-impact` | 이 DTO 바꾸면 어느 화면이 깨지는지 봐줘 | 신규·우선 시험 |
| [MyBatis 매핑 점검](../skills/mapper-contract-check/SKILL.md) `mapper-contract-check` | Mapper랑 XML 안 맞는 데 찾아줘 | 신규·우선 시험 |
| [동일 버그 재탐색](../skills/bug-variant-hunt/SKILL.md) `bug-variant-hunt` | 방금 고친 버그 다른 데도 남아 있는지 찾아줘 | 신규·우선 시험 |
| [SQL 실행계획 판독](../skills/sql-plan-review/SKILL.md) `sql-plan-review` | 이 SQL 왜 느린지 계획과 같이 봐줘 | 신규·우선 시험 |
| [DB 변경 사전 검토](../skills/db-change-preflight/SKILL.md) `db-change-preflight` | 이 컬럼 변경하면 어디가 깨지는지 봐줘 | 신규 |
| [트랜잭션 경계 추적](../skills/transaction-boundary/SKILL.md) `transaction-boundary` | 여기서 예외 나면 어디까지 롤백되는지 봐줘 | 신규·우선 시험 |
| [배치 재시작 점검](../skills/batch-restart-check/SKILL.md) `batch-restart-check` | 중간에 죽었다 다시 돌리면 중복되는지 봐줘 | 신규·우선 시험 |
| [스레드 덤프 판독](../skills/thread-dump-lens/SKILL.md) `thread-dump-lens` | 서버가 멈춘 것 같은데 덤프 비교해줘 | 신규 |
| [의존성 충돌 추적](../skills/dependency-conflict-lens/SKILL.md) `dependency-conflict-lens` | 왜 이 버전 JAR가 선택됐는지 찾아줘 | 신규 |
| [비동기 화면 상태 보호](../skills/async-state-guard/SKILL.md) `async-state-guard` | 조직을 바꾸면 이전 조회 결과가 덮어쓰는 문제를 봐줘 | 신규·우선 시험 |
| [업무 날짜 경계 진단](../skills/business-time-boundary/SKILL.md) `business-time-boundary` | 전월 집계가 자정과 월말에서 왜 빠지는지 봐줘 | 신규 |

## 30_test · 테스트

| 스킬 | 짧은 요청 | 구분 |
|---|---|---|
| [작업 QA](../skills/qa-sweep/SKILL.md) `qa-sweep` | 방금 만든 거 진짜 동작하는지 봐줘 | 기존 |
| [테스트 데이터 세트](../skills/fixture-factory/SKILL.md) `fixture-factory` | 이 입력 테스트할 데이터 만들어줘 | 기존 |
| [업무 조건표](../skills/rule-matrix/SKILL.md) `rule-matrix` | 이 로직 조건별로 표로 뽑아줘 | 기존 |
| [현업 확인표](../skills/acceptance-kit/SKILL.md) `acceptance-kit` | 현업한테 확인받을 표 만들어줘 | 기존 |
| [조건 조합 압축](../skills/pairwise-cases/SKILL.md) `pairwise-cases` | 조합이 너무 많으니 줄여줘 | 기존 |
| [기존 동작 고정](../skills/legacy-characterization/SKILL.md) `legacy-characterization` | 고치기 전에 현재 결과부터 고정해줘 | 신규·우선 시험 |
| [업무 불변식 검증](../skills/invariant-tests/SKILL.md) `invariant-tests` | 입력이 달라도 반드시 맞을 관계를 시험해줘 | 신규 |
| [테스트 검증력 점검](../skills/assertion-audit/SKILL.md) `assertion-audit` | 이 테스트가 진짜 버그를 잡는지 봐줘 | 신규 |

## 90_doc · 문서·리포트

| 스킬 | 짧은 요청 | 구분 |
|---|---|---|
| [리더용 요약](../skills/visual-brief/SKILL.md) `visual-brief` | 팀장님께 보여주게 한눈에 정리해줘 | 기존 |
| [흐름과 관계](../skills/diagram-maker/SKILL.md) `diagram-maker` | 이 흐름 그림으로 보여줘 | 기존 |
| [문서와 구현 대조](../skills/doc-drift/SKILL.md) `doc-drift` | 이 설명서 지금 코드랑 맞아? | 기존 |
| [숫자 변동 분해](../skills/variance-bridge/SKILL.md) `variance-bridge` | 이번 숫자 왜 달라졌는지 풀어줘 | 기존 |
| [실제 코드 경로 안내](../skills/code-path-tour/SKILL.md) `code-path-tour` | 이 조회가 화면부터 SQL까지 어떻게 이어지는지 보여줘 | 신규 |
| [장애 증거 타임라인](../skills/incident-evidence/SKILL.md) `incident-evidence` | 로그와 조치 기록으로 장애 순서 정리해줘 | 신규 |
