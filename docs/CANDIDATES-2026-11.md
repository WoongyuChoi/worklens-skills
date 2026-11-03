# 3차 스킬 발굴 — 선정 20개와 구현 추적

조사·구현 기준일: 2026-11-03, 한국 시간. **상태: 선정 20개 구현 완료 / 사내 반영·사내 실행 확인 전.**
사용자의 진행 요청에 따라 아래 후보 20개를 실제 스킬로 구현했습니다. 기존 20개와 합쳐 구현 수는 40개이며, 사내 반영이 확인된 범위는 기존 20개입니다. [구현 사용 안내](BATCH3-GUIDE.md)와 [검증 기록](VALIDATION.md)을 함께 확인하세요.

## 이번 선정의 기준

사용자 피드백은 “반입한 스킬 중 실제 쓸 만한 것은 반 정도”였습니다. 다음 기준으로 기존 20개와 대조했습니다.

1. **짧은 요청과 이미 가진 파일로 시작:** 별도 입력 양식이나 사전 설명을 길게 요구하지 않습니다.
2. **구체적인 결과물:** 문제 위치, 재현 사례, 수정안, 실행 결과, 근거가 있는 탐색 도구가 남아야 합니다.
3. **별도 전문 절차:** 기존 QA·파일 뷰어·조건표에 이름만 바꾼 후보는 제외합니다.
4. **추가 설치 없는 사용:** 인터넷·MCP·CDN·Python·npm 패키지·새 DB 연결을 필수로 하지 않습니다. 이미 있는 JDK/JUnit/프로젝트 실행 환경의 사용 여부는 개별적으로 표시합니다.
5. **생성 과정도 폐쇄망:** 최종 파일이 HTML이어도 제작에 React 번들러나 외부 폰트가 필요하면 그대로 반입하지 않습니다.
6. **근거의 구분:** 공개 스킬의 존재, 참고 방법의 타당성, 사내 Qwen의 실제 수행 성공은 서로 다른 확인입니다. 효율 향상 수치를 추정하지 않습니다.

아래 영어 이름은 **이번에 구현한 Worklens 스킬 이름**입니다. 공개 원본의 실제 이름과 URL은 각 항목에 따로 적었습니다. 대부분 원본의 범위를 좁힌 사내형 설계이며, 배치 일정과 재시작 검토는 공식 문서를 주 근거로 삼은 자체 설계입니다.

## 사내 카테고리 적용

사용자 제공 캡처의 분류 취지를 따랐습니다. 현재 `skills/<name>/` 설치 경로를 옮기는 작업은 포함하지 않습니다.

| 분류 | 이번에 담는 업무 | 후보 수 |
|---|---|---:|
| `00_common` | 공통 파일·시간 설정 진단 | 2 |
| `10_design` | 설계 대안과 UI 조작 방식 | 2 |
| `20_dev` | API·SQL·Java·배치·화면 상태의 구체 오류 분석 | 11 |
| `30_test` | 기존 동작 고정, 결과 판정 기준, 테스트 검증력 | 3 |
| `90_doc` | 실제 코드 안내와 장애 증거 기록 | 2 |

캡처에는 사내 개별 스킬의 명단과 본문이 없어, 중복 대조의 확인 범위는 이 저장소의 기존 20개입니다. 별도로 보유한 사내 변경파일 검토 스킬을 대체하는 범용 리뷰 후보는 넣지 않았습니다.

## 후보 한눈에 보기

**우선**은 알려진 Java·SQL·배치·React 업무에 비춰 먼저 시험할 8개입니다. 나머지 **상황별**은 해당 문제·입력 자료가 있을 때 사용합니다. 순서는 카테고리 순이며 생산성 측정 순위가 아닙니다.

| 번호 | 분류 | 후보 | 짧은 요청 | 반드시 남아야 할 결과 | 순위 |
|---:|---|---|---|---|---|
| 1 | 00_common | 한글·바이트 경계 진단 `encoding-boundary` | 한글에서 전문 길이가 왜 안 맞는지 봐줘 | 잘리는 위치·인코딩 경계·재현 문자열 | 상황별 |
| 2 | 00_common | 배치 일정 미리보기 `schedule-lens` | 이 배치들이 월말에 언제 겹치는지 보여줘 | 다음 실행 시각·중첩 구간·지원 문법 | 상황별 |
| 3 | 10_design | 설계 대안 비교 `design-decision` | 이 책임을 어디에 둘지 현재 코드로 비교해줘 | 대안별 변경 파일·선택 이유·재검토 조건 | 상황별 |
| 4 | 10_design | 키보드·포커스 점검 `a11y-focus` | 이 팝업과 트리를 키보드로 쓸 수 있게 봐줘 | 키 동작·포커스 이동표·수정안 | 상황별 |
| 5 | 20_dev | API 변경 영향 `api-change-impact` | 이 DTO 바꾸면 어느 화면이 깨져? | 엔드포인트→사용 코드→깨지는 필드 | 우선 |
| 6 | 20_dev | MyBatis 매핑 점검 `mapper-contract-check` | Mapper랑 XML 안 맞는 데 찾아줘 | 메서드·파라미터·SQL·resultMap 불일치 | 우선 |
| 7 | 20_dev | 동일 버그 재탐색 `bug-variant-hunt` | 방금 고친 버그 다른 데도 남아 있어? | 같은 원인 후보와 정상 유사 코드 제외 근거 | 우선 |
| 8 | 20_dev | SQL 실행계획 판독 `sql-plan-review` | 이 SQL 왜 느린지 계획과 같이 봐줘 | 병목 후보·계획 근거·확인할 변경안 | 우선 |
| 9 | 20_dev | DB 변경 사전 검토 `db-change-preflight` | 이 컬럼 변경하면 어디가 깨지는지 봐줘 | 영향 파일·반영 순서·복구 한계 | 상황별 |
| 10 | 20_dev | 트랜잭션 경계 추적 `transaction-boundary` | 여기서 예외 나면 어디까지 롤백돼? | 호출별 참여 관계·부분 저장 가능 경로 | 우선 |
| 11 | 20_dev | 배치 재시작 점검 `batch-restart-check` | 중간에 죽었다 다시 돌리면 중복돼? | 실패 지점별 재실행·중복·누락 시나리오 | 우선 |
| 12 | 20_dev | 스레드 덤프 판독 `thread-dump-lens` | 서버가 멈춘 것 같은데 덤프 비교해줘 | 락 대기 관계·반복 스택·시점별 변화 | 상황별 |
| 13 | 20_dev | 의존성 충돌 추적 `dependency-conflict-lens` | 왜 이 버전 JAR가 선택됐는지 찾아줘 | 선언→선택 버전→유입 경로→관리 지점 | 상황별 |
| 14 | 20_dev | 비동기 화면 상태 보호 `async-state-guard` | 조직 바꾸면 이전 조회 결과가 덮어써 | 응답 역전 재현·상태 갱신 수정안 | 우선 |
| 15 | 20_dev | 업무 날짜 경계 진단 `business-time-boundary` | 전월 집계가 자정·월말에서 왜 빠져? | 포함 구간·날짜 변환 오류·최소 재현 | 상황별 |
| 16 | 30_test | 기존 동작 고정 `legacy-characterization` | 고치기 전에 현재 결과부터 고정해줘 | 관측한 기준 출력과 회귀 테스트 | 우선 |
| 17 | 30_test | 업무 불변식 검증 `invariant-tests` | 입력이 달라도 반드시 맞을 관계를 시험해줘 | 근거 있는 불변식·시험 코드·실패 입력 | 상황별 |
| 18 | 30_test | 테스트 검증력 점검 `assertion-audit` | 이 테스트가 진짜 버그를 잡는지 봐줘 | 약한 검증·소수 변이 검출 결과·보강안 | 상황별 |
| 19 | 90_doc | 실제 코드 경로 안내 `code-path-tour` | 이 조회가 화면부터 SQL까지 어떻게 이어져? | 실제 파일·메서드를 따라가는 HTML 안내 | 상황별 |
| 20 | 90_doc | 장애 증거 타임라인 `incident-evidence` | 로그와 조치 기록으로 장애 순서 정리해줘 | 원문 위치가 있는 시간표·사실/가설·복구 근거 | 상황별 |

## 후보별 범위와 출처

### 1. 한글·바이트 경계 진단

- **입력과 산출물:** 원본 바이트, 인코딩 명세, 길이 제한, 처리 코드를 읽어 문자 수·UTF-16 단위·코드포인트·바이트 길이를 구분하고 최초로 값이 달라지는 구간을 찾습니다. 단일 HTML은 바이트와 해석 결과를 대조하는 보조 도구입니다.
- **기존과 차이:** `file-explorer`의 열람을 넘어 문자셋 선택·잘림·정규화로 생긴 실제 오류를 진단합니다. 공백 삭제 도구를 추가하는 것이 아닙니다.
- **원본:** [encoding-and-unicode-bug-diagnosis](https://github.com/anilamar/debugging-diagnostics-skills/blob/main/skills/encoding-and-unicode-bug-diagnosis/SKILL.md).
- **폐쇄망 조정:** 브라우저 기본 API로 UTF-8 바이트와 지원되는 decoding을 다룹니다. EUC-KR/MS949 재인코딩 검산은 이미 있는 JDK의 지원 charset을 확인한 경우에만 합니다. 원문의 Java 기본 charset 일반화는 [Java 21 Charset](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/charset/Charset.html)에 맞춰 보정합니다.
- **통과 기준:** 동일한 합성 문자열의 바이트·문자 단위 차이와 잘림 위치를 재현합니다. 원본 바이트 없이 깨진 텍스트만 있을 때 원래 인코딩을 확정하지 않습니다.

### 2. 배치 일정 미리보기

- **입력과 산출물:** cron 식, 스케줄러 종류, 시간대, 검토 기간, 알려진 수행시간으로 실행 후보 시각과 중첩 가능 구간을 계산합니다. 수행시간이 없으면 동시 시작만 표시합니다.
- **기존과 차이:** `config-compare`는 값의 차이, 이 후보는 설정이 만들어내는 실행 시각을 다룹니다. 등록·서버 조작 기능은 없습니다.
- **출처 성격:** [Spring Scheduling 공식 문서](https://docs.spring.io/spring-framework/reference/integration/scheduling.html)에 근거한 자체 설계입니다. 조사한 [cron-doctor](https://github.com/suryast/free-ai-agent-skills/blob/main/cron-doctor/SKILL.md)는 호스트 셸·cron 로그 진단이 중심이므로 원본 반입 추천에서 제외했습니다.
- **폐쇄망 조정:** 작은 vanilla JS 계산기를 만들 경우 방언과 문법을 제한합니다. Linux 5필드, Spring 6필드, Quartz를 구분하며 `L/W/#`, 휴일 캘린더, misfire 등 미지원 조건은 계산 불가로 표시합니다. 실행 시각은 실제 서버 실행을 보증하지 않습니다.
- **통과 기준:** 월말·윤년·불가능한 날짜·방언 차이 예제를 검산합니다. 기존 프로젝트의 스케줄러 라이브러리가 있으면 해당 버전 결과와 비교하며 새 패키지는 설치하지 않습니다.

### 3. 설계 대안 비교

- **입력과 산출물:** 현재 코드와 실제 제약에서 가능한 대안 2~3개를 잡고 변경 파일, 인터페이스, 운영 부담, 되돌리기 비용과 권고 이유를 정리합니다.
- **기존과 차이:** `project-playbook`은 결정된 규칙을 기억하고, 이 후보는 아직 정하지 않은 설계를 비교합니다. 일반 버그 수정에는 호출하지 않습니다.
- **원본:** Vercel AI의 [adr-skill](https://github.com/vercel/ai/blob/main/skills/adr-skill/SKILL.md), Anthropic의 [architecture](https://github.com/anthropics/knowledge-work-plugins/blob/main/engineering/skills/architecture/SKILL.md).
- **폐쇄망 조정:** 외부 기술 카탈로그 검색 대신 현재 허용된 구조와 자원 안에서 비교합니다. 긴 문답·플러그인 전용 저장 경로를 제거하고, 관측하지 않은 성능·비용 수치는 넣지 않습니다.
- **통과 기준:** 추상적 장단점 대신 실제 바뀌는 코드·계약이 나와야 합니다. 대안이 없거나 단순 규칙 기록이면 기존 스킬로 처리합니다.

### 4. 키보드·포커스 점검

- **입력과 산출물:** HTML/JSX/CSS와 대상 위젯을 읽고 Tab·방향키·Enter·Escape 동작, 팝업 진입·닫기·삭제 후 포커스 이동 및 수정 코드를 만듭니다.
- **기존과 차이:** `ui-polish`의 여백·정렬 개선과 달리 복합 위젯의 조작 방식과 포커스 생명주기가 대상입니다.
- **원본:** [humbleteam/accessibility-audit](https://github.com/humbleteam/accessibility-audit/blob/main/SKILL.md). 기준은 [W3C APG Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)로 보완합니다.
- **폐쇄망 조정:** axe·Lighthouse·MCP를 필수로 하지 않습니다. 이미 있는 브라우저에서 확인하고, 실제 조작이 없으면 정적 검토로만 표시합니다.
- **통과 기준:** 최소한 열기→이동→선택→닫기→호출 위치 복귀를 실제로 확인합니다. 접근성 전체 인증을 주장하지 않습니다.

### 5. API 변경 영향

- **입력과 산출물:** 변경 전후 Controller/DTO/Jackson 설정과 React/TypeScript 호출부를 연결하여 필수값·필드명·타입·상태코드 변경으로 깨지는 소비자를 찾습니다.
- **기존과 차이:** `doc-drift`의 문서 대조가 아닌 **서버 구현과 호출 코드 사이의 계약** 대조입니다. 연결 근거 없는 유사 클래스명은 짝으로 삼지 않습니다.
- **원본:** GitHub 커뮤니티 모음의 [api-breaking-change-detector](https://github.com/github/awesome-copilot/blob/main/skills/api-breaking-change-detector/SKILL.md).
- **폐쇄망 조정:** 원본은 C# Web API용이므로 Java/Spring/Jackson으로 규칙을 바꿔야 합니다. 소스 파일만으로 검사하며 OpenAPI 생성기·API 접속은 필수가 아닙니다.
- **통과 기준:** 합성 예제에서 필드 삭제·nullable 변경·필수 요청값 추가의 영향 위치를 잡고, 사용처를 찾지 못한 경우 미사용이라고 단정하지 않습니다. Java 타입만 보고 JSON의 필수 여부를 정하지 않습니다.

### 6. MyBatis 매핑 점검

- **입력과 산출물:** Mapper 인터페이스, XML, DTO, 관련 호출부를 읽어 namespace·statement id·파라미터 바인딩·별칭·resultMap을 대조합니다. 빈 목록으로 필터가 사라지는 경로와 복수 조인에 의한 행 증폭도 필요한 범위에서 추적합니다.
- **기존과 차이:** `rule-matrix`의 조건 설명이 아닌 여러 파일에 걸친 매핑 계약 확인입니다. `data-reconcile`의 결과 데이터 대조와도 구분됩니다.
- **원본:** ECC의 [mybatis-patterns](https://github.com/affaan-m/ECC/blob/main/pi/core/skills/mybatis-patterns/SKILL.md).
- **폐쇄망 조정:** 원본의 Testcontainers·DB EXPLAIN을 필수 과정에서 제외합니다. 정적 대조 결과와 SQL 실행 확인을 구분합니다. MyBatis가 아닌 사내 MDD 매핑이면 해당 형식의 실제 계약을 확인해야 합니다.
- **통과 기준:** 의도적으로 틀린 statement id, 파라미터명, 컬럼 별칭, 빈 목록 처리 사례를 잡고 정상 매핑은 오류로 올리지 않습니다.

### 7. 동일 버그 재탐색

- **입력과 산출물:** 확인된 버그와 원인, 수정 전후 코드에서 검색 패턴을 만들고 단계적으로 일반화합니다. 실제로 같은 원인인 후보, 안전한 유사 코드, 검토 범위를 나눠 제공합니다.
- **기존과 차이:** `qa-sweep`의 최근 변경분 QA와 달리, 이미 확인한 원인 하나를 기준으로 다른 발생 지점을 찾습니다. 원인 없는 저장소 전체 감사에는 쓰지 않습니다.
- **원본:** Trail of Bits의 [variant-analysis](https://github.com/trailofbits/skills/blob/main/plugins/variant-analysis/skills/variant-analysis/SKILL.md)와 [searching](https://github.com/trailofbits/skills/blob/main/plugins/variant-analysis/skills/variant-analysis/references/searching.md).
- **폐쇄망 조정:** 호스트의 파일 검색과 순차 판독으로 수행합니다. CodeQL·Semgrep·병렬 에이전트·CI 규칙 생성을 필수로 하지 않습니다.
- **통과 기준:** 원본 버그를 먼저 찾는 검색인지 확인하고, 복사된 결함 및 겉모양만 같은 정상 코드를 구분합니다. 후보 수를 확정 결함 수로 보고하지 않습니다.

### 8. SQL 실행계획 판독

- **입력과 산출물:** SQL, 바인드 자료형, 테이블·인덱스, 추출된 실행계획을 연결하여 비용이 큰 구간과 추정/실제 행 수 차이, 암시적 형변환 후보, 다음 확인안을 정리합니다.
- **기존과 차이:** `file-explorer`·`diagram-maker`의 표시 기능을 넘어 SQL과 계획을 해석합니다. HTML 트리는 필요한 경우만 씁니다.
- **원본과 보정 근거:** [sql-pro](https://github.com/Jeffallan/claude-skills/blob/main/skills/sql-pro/SKILL.md), [Oracle 실행계획 문서](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/generating-and-displaying-execution-plans.html).
- **폐쇄망 조정:** 이미 받은 계획 텍스트를 분석합니다. 원본의 고정 응답시간 목표·무조건적인 순차 스캔 제거 규칙은 사용하지 않습니다. DB 자동 접속·쿼리 실행은 필수가 아닙니다.
- **통과 기준:** FULL SCAN이라는 이름만으로 오류 판정하지 않습니다. 예상 계획과 실제 실행 통계를 구분하고, 실제 수치가 없으면 성능 개선을 확인했다고 하지 않습니다.

### 9. DB 변경 사전 검토

- **입력과 산출물:** 전후 DDL, 변경 SQL, 관련 코드와 알려진 DB 버전·규모로 값 절단·null·기본값·구신 코드 공존 문제와 단계별 반영안을 찾습니다.
- **기존과 차이:** `config-compare`의 설정 차이가 아닌 스키마와 데이터·호출 코드의 호환성입니다.
- **원본:** ECC의 [database-migrations](https://github.com/affaan-m/ECC/blob/main/skills/database-migrations/SKILL.md).
- **폐쇄망 조정:** Flyway·Liquibase·DB 연결 없이 정적으로 검토합니다. PostgreSQL 예제를 Oracle에 그대로 대입하지 않고 실제 버전의 DDL 커밋·잠금·온라인 변경 조건을 확인합니다.
- **통과 기준:** 컬럼 축소·이름 변경·필수 컬럼 추가의 영향을 찾고, 삭제된 데이터를 DDL 롤백만으로 복구할 수 있다고 쓰지 않습니다. 실행하지 않은 SQL은 검토안입니다.

### 10. 트랜잭션 경계 추적

- **입력과 산출물:** 진입점, 호출 메서드, 트랜잭션 설정, 예외 처리에서 프록시 진입·전파·별도 커밋·예외 처리에 따른 부분 저장 가능 경로를 추적합니다.
- **기존과 차이:** `rule-matrix`의 업무 조건표가 아닌 프레임워크의 커밋·롤백 의미를 다룹니다. 11번과 달리 한 번의 호출 내부가 중심입니다.
- **근거:** Java 스킬 패키지의 [동시성 검토 규칙](https://github.com/zander-zyx/java-development-skill/blob/main/code-review/cr-concurrency.md), Spring의 [트랜잭션 어노테이션](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html)과 [전파](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html).
- **폐쇄망 조정:** 코드 정적 추적이 기본입니다. 현재 Spring 버전·proxy/AspectJ·트랜잭션 관리자와 실제 설정을 먼저 확인하며, DB 통합시험은 기존 환경이 있을 때만 수행합니다.
- **통과 기준:** self-invocation·예외를 잡는 경우·별도 트랜잭션 사례의 차이를 설명하고, 어노테이션 존재만으로 원자성을 보장하지 않습니다.

### 11. 배치 재시작 점검

- **입력과 산출물:** 배치 코드, 업무 키·기준일, 체크포인트, 커밋 위치와 실패 기록으로 “어디까지 반영된 후 실패했는가”에 따른 재실행 결과표를 만듭니다.
- **기존과 차이:** `data-reconcile`은 실행 후 데이터를 비교합니다. 이 후보는 여러 실행 시도에 걸친 중복·누락 경로를 분석합니다. 10번의 트랜잭션 경계 결과를 입력으로 재사용할 수 있습니다.
- **출처 성격:** Spring Batch의 [Job 재시작](https://docs.spring.io/spring-batch/reference/5.1/job/configuring.html), [Step 구성](https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing/configuring.html), [Step 재시작](https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing/restart.html)을 주 근거로 한 자체 설계입니다. 조사한 [spring-batch 스킬](https://github.com/claude-dev-suite/claude-dev-suite/blob/main/skills/backend-frameworks/spring-batch/SKILL.md)은 MCP 조회와 단순화된 재시작 처방 때문에 그대로 도입하지 않습니다.
- **폐쇄망 조정:** 로컬 코드와 로그를 읽습니다. 자동 재실행은 하지 않습니다. Spring Batch가 아닌 배치는 그 시스템의 실제 작업 식별·체크포인트 계약을 따릅니다.
- **통과 기준:** 같은 실행의 재시작과 새 작업 인스턴스를 구분합니다. 실패 지점을 달리한 작은 예제에서 반영 이력·재처리·중복 방지 키가 연결돼야 합니다.

### 12. 스레드 덤프 판독

- **입력과 산출물:** 시각이 표시된 덤프 2~3개로 락 소유·대기 관계, 반복 스택, 풀 대기 후보, 시점별 진행 여부를 정리합니다.
- **기존과 차이:** `file-explorer`의 텍스트 탐색을 넘어 JVM 상태와 락 관계를 해석합니다.
- **근거:** Java 스킬 패키지의 [jvm-thread-dump](https://github.com/zander-zyx/java-development-skill/blob/main/jvm/jvm-thread-dump.md), [JDK 21 jcmd](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html).
- **폐쇄망 조정:** 받은 텍스트를 분석하므로 새 JDK·Arthas·VisualVM·웹 업로드가 필요 없습니다. 진단 명령은 수집 선택지이며 필수 실행 과정이 아닙니다.
- **통과 기준:** 정상 WAITING과 락 교착을 구분하고, 단일 스냅샷만으로 장시간 정체를 확정하지 않습니다. 플랫폼/가상 스레드 자료의 형식과 한도를 명시합니다.

### 13. 의존성 충돌 추적

- **입력과 산출물:** build.gradle, BOM/catalog, 이미 출력한 dependencies/dependencyInsight와 오류를 연결하여 선언 버전·선택 버전·유입 경로·선택 이유를 보여줍니다.
- **기존과 차이:** `config-compare`가 읽는 설정 차이를 넘어 전이 의존성의 실제 해결 경로를 추적합니다. 라이브러리를 추가하는 스킬이 아닙니다.
- **근거:** Java 스킬 패키지의 [Gradle 의존성 규칙](https://github.com/zander-zyx/java-development-skill/blob/main/build-tools/build-gradle-dependencies.md), [Gradle 의존성 조회](https://docs.gradle.org/current/userguide/viewing_debugging_dependencies.html).
- **폐쇄망 조정:** 기존 출력만 읽어도 됩니다. 새로 수집할 때는 설치된 wrapper·캐시와 offline 설정을 사용합니다. 캐시가 없으면 다운로드하지 않고 미확인으로 둡니다.
- **통과 기준:** BOM과 개별 버전 선언, 전이 경로, 충돌 해결 이유를 구분하고 NoSuchMethodError를 무조건 버전 하나의 문제로 단정하지 않습니다.

### 14. 비동기 화면 상태 보호

- **입력과 산출물:** 조회·저장 컴포넌트와 호출부에서 A→B 요청 후 B→A 응답이 오는 경로, 화면 전환·실패 시 입력 상태를 재현하고 수정안을 만듭니다.
- **기존과 차이:** `ui-polish`는 기존 동작을 보존하며 화면을 다듬습니다. 이 후보는 오래된 응답이 최신 상태를 덮는 실제 동작 오류를 수정합니다.
- **근거:** 실제 제품 저장소인 Grafana의 [frontend-testing-strategy](https://github.com/grafana/grafana/blob/main/.claude/skills/frontend-testing-strategy/SKILL.md), 특히 Anti-flake rules 5. [React 공식 Effects 문서](https://react.dev/learn/synchronizing-with-effects)로 보완합니다.
- **폐쇄망 조정:** 이미 쓰는 React·HTTP 클라이언트와 기본 JS를 사용합니다. React Query·SWR를 새로 넣지 않습니다. 설명용 정적 HTML을 만들어도 실제 앱 검증과 구분합니다.
- **통과 기준:** 응답 순서를 강제로 역전시켜 최신 조직·기간의 데이터가 유지되는지 확인합니다. 클라이언트 요청 취소를 서버 저장 취소로 해석하지 않습니다.

### 15. 업무 날짜 경계 진단

- **입력과 산출물:** 날짜 처리 코드, SQL 기간 조건, 업무 기준일 정의, DB/JVM 시간대와 재현 날짜에서 잘못된 포함 구간·변환 경계를 찾고 최소 재현을 만듭니다.
- **기존과 차이:** `fixture-factory`의 날짜 샘플 생성과 달리 실제 기간 산정 오류를 추적합니다. 2번은 배치가 언제 실행되는가, 이 후보는 어떤 기간의 업무를 처리하는가입니다.
- **원본과 보정:** [time-zone-and-locale-bug-diagnosis](https://github.com/anilamar/debugging-diagnostics-skills/blob/main/skills/time-zone-and-locale-bug-diagnosis/SKILL.md), [Java LocalDate](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/LocalDate.html)와 [Instant](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Instant.html).
- **폐쇄망 조정:** 기존 JDK java.time과 고정 Clock을 활용합니다. 원본의 일률적인 UTC 처방 대신 업무 날짜와 실제 시점을 구분합니다. 영업일 판정은 사내 달력 자료가 있어야 합니다.
- **통과 기준:** 월말·연말·윤년·자정 경계에서 포함/제외가 요구사항과 맞는지 확인합니다. 코드의 현재 동작을 승인된 업무 규칙으로 취급하지 않습니다.

### 16. 기존 동작 고정

- **입력과 산출물:** 수정할 레거시 메서드와 기존 실행 환경에서 관측한 출력으로 기준 결과와 회귀 테스트를 만듭니다. 이상해 보이는 기존 동작은 별도 표시합니다.
- **기존과 차이:** `fixture-factory`는 시험 입력을 만들고, 이 후보는 변경 전 실제 출력을 고정합니다. 기존 출력이 업무상 정답이라는 뜻은 아닙니다.
- **원본:** [characterization-test-writer](https://github.com/SkillMedev/legacy-modernization/blob/main/skills/characterization-test-writer/SKILL.md).
- **폐쇄망 조정:** 이미 있는 JUnit/JDK만 활용합니다. ApprovalTests·freezegun·libfaketime 등을 필수로 추가하지 않습니다. 실행 환경이 없으면 시험 초안이며 동작 고정 완료가 아닙니다.
- **통과 기준:** 변경 전 기준 결과를 실제로 관측하고, 의미 있는 동작 변화에서 회귀 테스트가 실패하는지 확인합니다. 실행 횟수가 적다는 이유로 모든 비결정성이 제거됐다고 하지 않습니다.

### 17. 업무 불변식 검증

- **입력과 산출물:** 집계·정규화·변환 로직과 업무 규칙에서 순서 독립성·멱등성·복원 관계 등 성립해야 할 조건을 찾아 기존 시험 환경용 코드를 만듭니다.
- **기존과 차이:** `fixture-factory`의 입력이나 `pairwise-cases`의 조합 대신 **결과의 옳고 그름을 판단하는 관계**가 산출물입니다. 계산식을 기대값에 그대로 복제하지 않습니다.
- **원본:** Trail of Bits의 [property-based-testing](https://github.com/trailofbits/skills/blob/main/plugins/property-based-testing/skills/property-based-testing/SKILL.md).
- **폐쇄망 조정:** jqwik·Hypothesis·fast-check를 설치하지 않고 기존 JUnit의 결정적 입력 집합·반복으로 범위를 줄입니다. 자동 shrinking·광범위한 생성 탐색을 제공한다고 하지 않습니다.
- **통과 기준:** 알려진 결함에서 관계가 깨지는지 확인합니다. 반올림 위치·가중치 때문에 성립하지 않는 합산 관계는 채택하지 않고, 유효한 관계가 없는 일반 CRUD에는 강제로 쓰지 않습니다.

### 18. 테스트 검증력 점검

- **입력과 산출물:** 기존 테스트와 실제 대상 코드를 비교하여 자기검증·분기 미진입·약한 assertion을 찾고 소수의 의미 있는 변이가 검출되는지 확인합니다.
- **기존과 차이:** `qa-sweep`의 제품 검증과 달리 테스트 자체가 결함을 검출하는지가 대상입니다. 입력 생성기나 테스트 양 늘리기가 아닙니다.
- **원본:** Grafana의 [frontend-testing-strategy](https://github.com/grafana/grafana/blob/main/.claude/skills/frontend-testing-strategy/SKILL.md), 특히 Principle 2.
- **폐쇄망 조정:** 기존 시험 도구만 사용하고 격리된 사본에서 제한된 변이를 확인합니다. Grafana·pnpm·Jest·Playwright·mewt·muton을 새로 반입하지 않습니다.
- **통과 기준:** 정상 코드 통과→의미 있는 변이 실패→원복 후 통과를 확인합니다. 전체 mutation score나 테스트의 완전성을 주장하지 않습니다.

### 19. 실제 코드 경로 안내

- **입력과 산출물:** 한 기능의 진입점부터 읽은 파일·메서드·코드 발췌를 다음/이전 방식의 HTML 안내로 연결합니다. 입력·호출·반환·예외의 근거를 보여줍니다.
- **기존과 차이:** `diagram-maker`의 관계도보다 실제 소스를 읽는 순서가 중심이며 `session-handoff`의 미완료 작업 인계와도 목적이 다릅니다.
- **원본:** GitHub 커뮤니티 모음의 [code-tour](https://github.com/github/awesome-copilot/blob/main/skills/code-tour/SKILL.md).
- **폐쇄망 조정:** 원본의 .tour·VS Code CodeTour 확장·Python validator 대신 inline HTML/CSS/JS와 포함된 코드 발췌로 만듭니다. 원본을 그대로 쓰는 방법이 아닙니다.
- **통과 기준:** 모든 단계가 실제 확인한 소스 위치와 연결돼야 합니다. 정적 추적·설명용 값 변화를 실제 프로그램 실행으로 표시하지 않습니다. 파일 목록만 나열하면 탈락입니다.

### 20. 장애 증거 타임라인

- **입력과 산출물:** 로그·배포/배치 기록·조치 메모의 시각과 요청 식별자를 연결하여 원본 위치가 붙은 시간표, 원인 후보별 근거, 확인된 복구 시점을 만듭니다.
- **기존과 차이:** `visual-brief`의 요약보다 기록 간 대조와 원인 주장 검증이 핵심입니다. 단순 로그 뷰어로 끝나면 추가 가치가 없습니다.
- **원본:** GitHub 커뮤니티 모음의 [incident-postmortem](https://github.com/github/awesome-copilot/blob/main/skills/incident-postmortem/SKILL.md). 복구 절차 출력은 [testdouble/han runbook](https://github.com/testdouble/han/blob/main/han-documentation/skills/runbook/SKILL.md)의 관점을 참고할 수 있습니다.
- **폐쇄망 조정:** 외부 Slack/PagerDuty 조회·Han 설정·다른 스킬 호출을 필수로 하지 않습니다. 확인된 대응이 있을 때만 “증상→확인→기대 출력→조치→복구 확인”을 같은 스킬의 모드로 제공합니다. 별도 후보로 중복 계산하지 않았습니다.
- **통과 기준:** 시간대·시계 차이·로그 누락을 표시하고 시간상 선후를 인과관계로 확정하지 않습니다. 알려지지 않은 담당자·기한·복구 성공을 만들어내지 않습니다.

## 최근성 확인과 출처 해석

2026-11-03에 공개 본문을 확인했습니다. 검색 크롤링 날짜를 출시일로 쓰지 않았습니다. 아래는 GitHub 파일 변경 기록을 확인한 사례이며, 최근 수정과 효과 검증은 별개입니다.

| 원본 | 확인한 변경 | 해석 |
|---|---|---|
| api-breaking-change-detector | [2026-09-22 신규 추가](https://github.com/github/awesome-copilot/commit/d67204825b898696efd5884c35ad2d935ae63af7) | 최근 추가된 실제 스킬 사례 |
| encoding-and-unicode-bug-diagnosis | [2026-09-14 초기 추가](https://github.com/anilamar/debugging-diagnostics-skills/commit/44b4555b0aebce672711f262fc771a280245c5bd) | 비교적 최근 진단 스킬이나 Java 설명 보정 필요 |
| ECC mybatis-patterns | [2026-10-01 한국 시간 파일 갱신](https://github.com/affaan-m/ECC/commit/3c17f41a43b2744856f842a7a2d69de3b2be5e0c) | 최근 유지보수 확인. 그날 처음 생긴 기능이라는 뜻은 아님 |
| Grafana frontend-testing-strategy | [2026-10-29 한국 시간 pnpm 문서 갱신](https://github.com/grafana/grafana/commit/8d109aec3e7044c3d2b41b268f06cc04248226a3) | 실제 제품의 현행 작업 지침. 테스트 기법의 출시일로 해석하지 않음 |

GitHub 조직의 awesome-copilot은 커뮤니티 모음이며, 개별 스킬의 성능을 GitHub가 보증했다는 의미가 아닙니다. 나머지 커뮤니티 원본도 동일합니다. Oracle·Spring·Java·Gradle·W3C 공식 문서는 기술 의미를 보정하는 근거입니다. 구현 시에는 대상 프로젝트의 실제 버전으로 참고 자료를 고정해야 합니다.

## 제외하거나 기존 기능으로 합친 후보

| 조사 항목 | 결정과 이유 |
|---|---|
| 범용 개발 지휘·병렬 작업 | 기존 dev-conductor/parallel-batch와 중복이며 효용이 낮다는 직접 피드백이 있음 |
| 범용 변경파일 리뷰·일반 디버깅 절차 | 기존 qa-sweep 및 사내 변경파일 검토의 개선 근거로 활용. 독립 후보로 세지 않음 |
| UI polish·범용 화면 생성·보고서 꾸미기 | ui-polish/screen-prototype/visual-brief가 이미 수행 |
| 상태전이 사례·동시수정 사례를 별도 카탈로그로 분할 | 이번에는 기존 조건표·조합·검수표 또는 비동기 상태 후보와의 중복 위험을 고려해 보류 |
| 복구 런북을 별도 21번째 스킬로 추가 | incident-evidence의 확인된 복구 절차 출력 모드로 합침 |
| [Anthropic web-artifacts-builder](https://github.com/anthropics/skills/blob/main/skills/web-artifacts-builder/SKILL.md) | React·Vite·Parcel·Tailwind·shadcn/ui 및 설치 과정이 있어 현재 조건으로 그대로 반입 부적합 |
| [walkthrough HTML template](https://github.com/alexanderop/walkthrough/blob/main/skills/walkthrough/references/html-patterns.md) | 단일 HTML 소개와 별개로 CDN·Mermaid·Shiki 의존성이 있어 원본 그대로 사용 불가 |
| 대규모 mutation 캠페인·외부 서비스 기반 flaky 분석 | 별도 실행 도구·인증 서비스가 필요. 소수 assertion 검증만 기존 도구 범위로 축소 |

## 구현에 들어갈 때의 검증 순서

우선 8개는 API 변경 영향, MyBatis 매핑, 동일 버그 재탐색, SQL 실행계획, 트랜잭션 경계, 배치 재시작, 비동기 화면 상태, 기존 동작 고정입니다.

각 스킬은 독립 폴더에 필요한 지침·참조·자산을 함께 넣고, 영어 실행 지침과 한국어 입출력으로 만듭니다. HTML이 유용한 후보만 정적 HTML을 사용합니다. 특히 일정 계산처럼 자체 엔진이 필요한 후보와 코드 읽기 중심 후보를 같은 구현 난도로 취급하지 않습니다.

1. 한 줄 요청과 작은 합성 사례로 시작해 대상 파일을 찾을 수 있는지 확인합니다.
2. 정상 사례와 의도적으로 넣은 오류를 구분하고, 주장마다 소스 위치나 실행 근거를 남깁니다.
3. 추가 설치·네트워크 호출 없이 산출물을 만들고, 실제 결과물이 생성 과정의 근거와 맞는지 확인합니다.
4. 같은 업무에 기존 스킬을 사용한 결과와 비교합니다. 결과가 같고 전문 절차의 이점이 없다면 기존 스킬에 합칩니다.
5. 사내 실제 사용은 별도 기록합니다. 설치 완료, 정적 확인, 실제 실행, 반복 활용을 각각 구분합니다.

이 문서는 선정 당시의 범위·출처·통과 기준을 보존합니다. 신규 20개의 SKILL.md, 전문 참조·양식과 유용한 6개 HTML을 구현했습니다. 실제 지원 범위와 한도는 각 스킬의 지침 및 참조 문서가 우선하며, 사내 실행 결과는 아직 없습니다.
