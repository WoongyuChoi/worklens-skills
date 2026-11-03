# Worklens Skills

**짧은 요청으로 문제를 찾고, 근거와 확인 수준을 남기는 폐쇄망용 스킬 40개입니다.**

실행 지침은 영어, 사용자가 보는 결과와 예시는 한국어입니다. 인터넷·CDN·MCP·패키지 설치·DB 접속을 기본 전제로 삼지 않습니다. 이미 있는 프로젝트 도구를 쓰는 경우와 정적 검토만 가능한 경우를 구분합니다.

- **기존 20개:** 사내 반영 완료. 반영 완료와 실제 유용성 평가는 다릅니다.
- **신규 20개:** 2026-11-03 구현. 사내 반영·사내 Qwen 실행은 확인 전입니다.
- **최근 피드백:** 반입한 스킬 중 쓸 만한 것은 반 정도. dev-conductor와 parallel-batch는 효용 낮음 피드백에 따라 신규 추천 우선순위를 낮췄습니다.

[전체 40개 목록](docs/CATALOG.md) · [신규 팩 활용 안내](docs/BATCH3-GUIDE.md) · [사내 반영 상태](docs/ADOPTION.md) · [선정 근거와 출처](docs/CANDIDATES-2026-11.md)

## 신규 20개 — 어떤 문제에 쓰나요?

**우선**은 Java·SQL·배치·React 업무에서 먼저 시험할 8개이며, 생산성을 측정한 순위는 아닙니다.

| 분류 | 스킬 | 짧은 요청 | 우선 |
|---|---|---|---|
| 00_common | [한글·바이트 경계 진단](skills/encoding-boundary/SKILL.md) | 한글에서 전문 길이가 왜 안 맞는지 봐줘 |  |
| 00_common | [배치 일정 미리보기](skills/schedule-lens/SKILL.md) | 이 배치들이 월말에 언제 겹치는지 보여줘 |  |
| 10_design | [설계 대안 비교](skills/design-decision/SKILL.md) | 이 책임을 어디에 둘지 현재 코드로 비교해줘 |  |
| 10_design | [키보드·포커스 점검](skills/a11y-focus/SKILL.md) | 이 팝업과 트리를 키보드로 쓸 수 있게 봐줘 |  |
| 20_dev | [API 변경 영향](skills/api-change-impact/SKILL.md) | 이 DTO 바꾸면 어느 화면이 깨지는지 봐줘 | ● |
| 20_dev | [MyBatis 매핑 점검](skills/mapper-contract-check/SKILL.md) | Mapper랑 XML 안 맞는 데 찾아줘 | ● |
| 20_dev | [동일 버그 재탐색](skills/bug-variant-hunt/SKILL.md) | 방금 고친 버그 다른 데도 남아 있는지 찾아줘 | ● |
| 20_dev | [SQL 실행계획 판독](skills/sql-plan-review/SKILL.md) | 이 SQL 왜 느린지 계획과 같이 봐줘 | ● |
| 20_dev | [DB 변경 사전 검토](skills/db-change-preflight/SKILL.md) | 이 컬럼 변경하면 어디가 깨지는지 봐줘 |  |
| 20_dev | [트랜잭션 경계 추적](skills/transaction-boundary/SKILL.md) | 여기서 예외 나면 어디까지 롤백되는지 봐줘 | ● |
| 20_dev | [배치 재시작 점검](skills/batch-restart-check/SKILL.md) | 중간에 죽었다 다시 돌리면 중복되는지 봐줘 | ● |
| 20_dev | [스레드 덤프 판독](skills/thread-dump-lens/SKILL.md) | 서버가 멈춘 것 같은데 덤프 비교해줘 |  |
| 20_dev | [의존성 충돌 추적](skills/dependency-conflict-lens/SKILL.md) | 왜 이 버전 JAR가 선택됐는지 찾아줘 |  |
| 20_dev | [비동기 화면 상태 보호](skills/async-state-guard/SKILL.md) | 조직을 바꾸면 이전 조회 결과가 덮어쓰는 문제를 봐줘 | ● |
| 20_dev | [업무 날짜 경계 진단](skills/business-time-boundary/SKILL.md) | 전월 집계가 자정과 월말에서 왜 빠지는지 봐줘 |  |
| 30_test | [기존 동작 고정](skills/legacy-characterization/SKILL.md) | 고치기 전에 현재 결과부터 고정해줘 | ● |
| 30_test | [업무 불변식 검증](skills/invariant-tests/SKILL.md) | 입력이 달라도 반드시 맞을 관계를 시험해줘 |  |
| 30_test | [테스트 검증력 점검](skills/assertion-audit/SKILL.md) | 이 테스트가 진짜 버그를 잡는지 봐줘 |  |
| 90_doc | [실제 코드 경로 안내](skills/code-path-tour/SKILL.md) | 이 조회가 화면부터 SQL까지 어떻게 이어지는지 보여줘 |  |
| 90_doc | [장애 증거 타임라인](skills/incident-evidence/SKILL.md) | 로그와 조치 기록으로 장애 순서 정리해줘 |  |

## 바로 열어 쓸 수 있는 신규 HTML 6개

압축을 풀고 **index.html**을 열면 이름·요청·카테고리로 스킬을 찾고 HTML로 이동할 수 있습니다. GitHub의 HTML 소스 화면은 도구 실행 화면이 아닙니다.

| 도구 | 실제 제공 기능 | 범위 |
|---|---|---|
| [바이트 경계](skills/encoding-boundary/assets/tool.html) | 원본 바이트·UTF-16·코드포인트·UTF-8 길이와 잘림 비교 | UTF-8 인코딩 / 명시한 문자셋 디코딩 |
| [배치 일정](skills/schedule-lens/assets/tool.html) | 실행 후보 시각·동시 시작·알려진 수행시간 중첩 | Spring 6필드 숫자 부분집합 / 고정 UTC 오프셋 |
| [스레드 덤프](skills/thread-dump-lens/assets/tool.html) | 모니터 소유·대기 관계와 시점별 반복 스택 | 전통적 HotSpot 플랫폼 스레드 텍스트 |
| [비동기 응답 실험](skills/async-state-guard/assets/race-lab.html) | 응답 순서·오류·화면 종료를 직접 바꿔 상태 비교 | 설명용 로컬 실험 / 실제 앱 검증과 구분 |
| [코드 경로 안내](skills/code-path-tour/assets/tool.html) | 소스 단계 탐색·검색·근거 표시·단일 HTML 저장 | 실제 소스에서 작성한 안내 JSON 표시 |
| [장애 시간표](skills/incident-evidence/assets/tool.html) | 원문 줄·시간대·미해결 기록을 보존한 시간표 | 명시한 ISO 형식 / JSON·CSV 저장 |

기존 파일 뷰어·시안·텍스트 도구·도식과 2차 계산 도구 5개도 통합팩에 포함합니다. 전체 HTML 자산은 15개입니다. 모든 신규 스킬에는 지침과 필요한 전문 참조·입출력 예시·양식이 들어 있습니다.

## 폐쇄망에 가져가기

1. 제공된 **신규 20개 추가팩** 또는 **전체 40개 통합팩**을 내려받아 반입 후 압축을 풉니다. GitHub에서는 **Code → Download ZIP**으로 전체 저장소도 받을 수 있습니다.
2. `index.html`에서 필요한 스킬을 찾습니다.
3. `skills/스킬이름`을 **폴더째** Qwen의 스킬 위치에 복사합니다. SKILL.md만 복사하면 참조 문서와 자산이 빠집니다.

| 적용 범위 | 위치 |
|---|---|
| Windows 사용자 | `%USERPROFILE%\.qwen\skills\스킬이름\SKILL.md` |
| Linux 사용자 | `~/.qwen/skills/스킬이름/SKILL.md` |
| 현재 프로젝트 | `프로젝트/.qwen/skills/스킬이름/SKILL.md` |

사용 중인 사내 CLI 버전의 등록 방식을 우선합니다. `/skills`를 지원하면 등록 상태를 확인하세요. 자동 선택이 불안정하면 “mapper-contract-check 스킬로 이 Mapper와 XML을 봐줘”처럼 이름을 함께 요청하세요.

Windows cmd에서 압축을 푼 폴더에 들어가 해당 팩의 스킬을 복사하는 예:

    xcopy "skills" "%USERPROFILE%\.qwen\skills" /E /I /-Y

같은 이름의 파일이 있으면 덮어쓰기 여부를 확인합니다. 자체 수정한 기존 스킬은 사본을 보관한 뒤 교체 범위를 확인하세요. `agents/openai.yaml`은 호환용 메타데이터이며 Qwen 사용의 필수 조건은 아닙니다.

사내 카테고리는 찾아보기용 분류입니다. 실제 스킬을 `skills/00_common/...`처럼 재배치하지 않습니다. SAP 전용 영역은 이번 팩에 추가하지 않았습니다.

## 무엇을 확인했나요?

스킬 구조·참조 파일·인라인 JavaScript 문법, 계산 엔진 경계값, 합성 코드 적용과 기존 도구 회귀를 확인했습니다. 결과와 재실행 방법은 [검증 기록](docs/VALIDATION.md)에 있습니다.

현재 검증 환경에는 Chromium 실행파일이 없어 **실제 브라우저 렌더링·파일 선택·다운로드 UI는 확인하지 못했습니다.** JavaScript/최소 DOM 검증과 실제 브라우저 검증은 구분합니다. 사내 Qwen의 자동 선택·모델 지시 준수·실무 시간 절감도 별도 확인이 필요합니다.

- [출처와 재작성 범위](docs/SOURCES.md)
- [기존 스킬의 짧은 사용 시나리오](docs/TRY-IT.md)
- [개발용 검사](tests/README.md)

외부 프로젝트의 코드를 그대로 반입한 패키지가 아닙니다. 공개 절차와 공식 기술 문서를 참고해 폐쇄망과 한국어 업무용으로 새로 작성했습니다. 스킬 자체가 파일 도구·병렬 에이전트·프로젝트 실행 환경을 추가하지 않습니다.
