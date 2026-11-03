# 참고 출처

확인일: 2026-09-23

아래 공개 원문에서 절차와 설계 관점을 참고했습니다.
Worklens의 지시문과 HTML 템플릿은 새로 작성했으며, 외부 프로젝트의 코드나 전체 지시문을 복제하지 않았습니다.
공개 사례의 존재와 사내 모델에서의 검증은 별개입니다.

| 공개 원문 | 참고한 부분 | Worklens에서 조정한 점 |
|---|---|---|
| [Superpowers: dispatching-parallel-agents](https://github.com/obra/superpowers/blob/main/skills/dispatching-parallel-agents/SKILL.md) | 독립 작업의 분리와 결과 통합 | 실제 도구 확인, 기본 작업자 수 제한, 파일과 공유 자원 소유권, 순차 대안 |
| [Superpowers: subagent-driven-development](https://github.com/obra/superpowers/blob/main/skills/subagent-driven-development/SKILL.md) | 구현과 검토 담당 분리 | 단일 작성자 기본, Git 없는 기준본, 폐쇄망 로컬 검증, 제한된 수정 반복 |
| [Superpowers: verification-before-completion](https://github.com/obra/superpowers/blob/main/skills/verification-before-completion/SKILL.md) | 완료 주장 이전의 실행 근거 | 실행/정적/실패/미확인 구분, 최종 변경 후 재검증 |
| [Planning with Files](https://github.com/OthmanAdi/planning-with-files/blob/master/skills/planning-with-files/SKILL.md) | 파일에 진행 상황과 발견 사항 보존 | 단일 작업 인계 파일, 여러 작업 선택, 저장되지 않은 과거를 복원했다고 주장하지 않음 |
| [Anthropic: frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) | 목적과 내용에 맞는 시각적 위계 | 한국어 가독성, 큰 글씨, 로컬 시스템 폰트, 실제 동작하는 오프라인 시안 |
| [Anthropic: claude-md-improver](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/claude-md-management/skills/claude-md-improver/SKILL.md) | 프로젝트 지침 발견과 정리 | QWEN.md 연결, 확정한 규칙만 저장, 기존 지침 보존 |
| [Anthropic의 내부 스킬 활용 사례](https://claude.com/blog/lessons-from-building-claude-code-how-we-use-skills) | 반복 실수, 템플릿, 작은 전문 절차 | 입력 준비 부담을 줄이고 결과를 짧게 출력 |
| [Qwen Code Agent Skills](https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/) | 스킬 경로와 검색/등록 방식 | 프로젝트 및 사용자 폴더 복사 설치, 선택 설치 |
| [Qwen Code Agent Tool](https://qwenlm.github.io/qwen-code-docs/en/developers/tools/task/) | 실제 에이전트 호출과 병렬 실행 | 설치 버전에 도구가 없으면 순차 실행 |

## 외부 원문을 추가로 가져올 때

특정 버전의 원문을 직접 포함하게 되면 그 버전의 출처, 라이선스, 고지와 변경 내역을 함께 관리합니다.
링크된 원문의 라이선스가 Worklens의 라이선스로 바뀌는 것은 아닙니다.
현재 패키지의 실행 과정은 이 링크에 접속하지 않습니다.

## 2026-09-28 2차 스킬 구현

[2차 스킬 10개 설계](NEXT-SKILLS.md)에 원문, 기존 스킬과의 차이, 폐쇄망 적용에 필요한 변경을 함께 기록했습니다.
후보 10개를 별도 스킬로 구현했습니다. 지시문, 계산 엔진, HTML과 양식은 Worklens에서 새로 작성했으며 외부 프로젝트의 코드나 지시문을 그대로 포함하지 않았습니다.
Impeccable의 바이너리, SQL Server 대조 스킬의 Python/Arrow, Redacta의 Python 스크립트는 필수 의존성으로 넣지 않았습니다.
외부 원문의 출처와 이번 구현의 품질 검증은 별개이며, 사내 Qwen 동작은 아직 검증하지 않았습니다.

## 2026-11-03 3차 발굴

[신규 후보 20개](CANDIDATES-2026-11.md)에 공개 원문, 공식 기술 근거, 기존 20개와의 경계, 제거할 의존성, 구현 후 통과 기준을 기록했습니다.
공개 SKILL.md와 스킬 패키지의 세부 규칙을 확인한 사내형 후보이며, 일정 미리보기·배치 재시작 점검은 공식 문서 중심의 자체 설계로 구분했습니다.
사용자 진행 요청에 따라 신규 20개를 구현했습니다. 지시문·계산 엔진·HTML·합성 예제는 새로 작성했으며, 외부 코드·지시문 원문을 그대로 패키지에 복제하지 않았습니다.
최근 커밋은 유지보수 증거로만 사용하며, 인기 순위·생산성·사내 실행 성공을 보증하지 않습니다.


### 3차 구현 시 공식 의미 확인

- [WHATWG Encoding](https://encoding.spec.whatwg.org/): TextEncoder의 UTF-8 범위, 명시한 TextDecoder 문자셋, fatal과 BOM 보존의 의미. EUC-KR/MS949 재인코딩은 제공하지 않습니다.
- [Java 21 Thread.State](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.State.html): JVM 상태와 운영체제 실행 상태를 혼동하지 않고 WAITING을 곧바로 장애로 판단하지 않습니다.
- Spring 일정은 일반 전체 cron 호환을 주장하지 않고 숫자 문법의 작은 부분집합과 고정 오프셋으로 제한했습니다. 지원하지 않는 방언과 문법은 명시적으로 거부합니다.
- API·Mapper·Oracle·트랜잭션·재시작·날짜·테스트의 전문 규칙은 선정 문서의 공식 출처를 근거로 하되, 프로젝트 버전·설정·실제 실행 근거가 없을 때 확정하지 않도록 구성했습니다.

배포 ZIP에는 공개 원문의 코드·라이브러리·바이너리가 포함되지 않습니다. 외부 출처 링크는 연구·검토용이며 스킬 실행에 접속을 요구하지 않습니다.


### 세부 계약의 공식 참조

- [Jackson JsonProperty](https://www.javadoc.io/static/com.fasterxml.jackson.core/jackson-annotations/2.21/com/fasterxml/jackson/annotation/JsonProperty.html), [DeserializationFeature](https://www.javadoc.io/static/com.fasterxml.jackson.core/jackson-databind/2.18.5/com/fasterxml/jackson/databind/DeserializationFeature.html): 속성 존재·명시적 null·creator 설정을 나누어 검토합니다. 링크 버전을 실제 프로젝트 버전으로 가정하지 않습니다.
- [MyBatis Java API](https://mybatis.org/mybatis-3/java-api.html), [Mapper XML](https://mybatis.org/mybatis-3/sqlmap-xml.html): scalar/DTO/@Param 루트와 동적 SQL·resultMap의 실제 바인딩을 확인합니다.
- [Oracle 19c COMMIT](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/COMMIT.html): DDL 경계와 일반 DML rollback을 혼동하지 않도록 참조했습니다.
- [Spring 6.2 rollback rules](https://docs.spring.io/spring-framework/reference/6.2/data-access/transaction/declarative/rolling-back.html): 프로젝트의 명시/전역 예외 규칙과 버전을 확인하도록 반영했습니다.


## 4차 보안 5개 — 2026-11-03

조사·선정 근거와 실제 파일 커밋은 [보안 조사 보고서](SECURITY-RESEARCH-2026-11.md)에 기록했습니다. 다섯 스킬의 지침·보조 스크립트·합성 fixture·HTML은 독립 작성했습니다. 아래 스킬 원문·PDF·scanner·실행환경은 복사하거나 동봉하지 않았습니다.

| 대상 | 참고한 1차 자료 | 적용과 제한 |
|---|---|---|
| api-authz-probe | [Spring JSON Patch 권고](https://spring.io/security/cve-2026-47849/), [OWASP API BOLA](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/), [ASVS 5.0.0](https://asvs.owasp.org/) | 메서드·객체·주체·속성의 권한을 대조. Spring 권고는 2026-08-20, OWASP API 2023은 기준 표준 |
| privacy-log-audit | [OpenTelemetry 민감 데이터](https://opentelemetry.io/docs/security/handling-sensitive-data/), [2026-05-19 레거시 환경 보안](https://opentelemetry.io/blog/2026/security-legacy-environments/), [OWASP Logging](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) | 필요한 이벤트를 보존하면서 불필요 필드 수집·출력을 줄임. OTel 설치 요구 없음 |
| source-sink-review | [Spring Sort](https://spring.io/security/cve-2026-47834/), [Gateway Resource](https://spring.io/security/cve-2026-47879/), [FreeMarker](https://spring.io/security/cve-2026-59280/) | 2026-08-20 공지의 구체적 입력·기능·권한 조건. 로컬 witness는 실제 CVE exploit이 아님 |
| dependency-advisory-triage | [Spring LDAP](https://spring.io/security/cve-2026-59270/), [WebAuthn](https://spring.io/security/cve-2026-47841/), [ONNX](https://spring.io/security/cve-2026-47852/), [React RSC](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components), [OSV 1.9.2](https://ossf.github.io/osv-schema/), [GitHub malware advisories](https://github.blog/security/supply-chain-security/how-we-took-malware-advisories-beyond-npm/) | 조건·날짜·철회·alias·생태계·수정 버전 제공 채널. snapshot 6건은 독립 요약한 사실 데이터, 전체 DB 아님 |
| agent-boundary-check | [OWASP Manual 2026-10-20](https://genai.owasp.org/resource/genai-red-teaming-manual-version-1-0/), [Guide 2.0 2026-10-27](https://genai.owasp.org/resource/llm-exploit-generation-guide-2-0/), [ACS 2026-09-01](https://genai.owasp.org/resource/agent-control-standard-acs/) | 통제된 입력, 관측 가능한 도구 시도·차단·후속 효과. 참조 runtime은 반입하지 않음 |

공개 SKILL 조사에서 OpenAI `security-scan`의 plugin manifest가 Proprietary임을 확인했습니다. Trail of Bits `vulnerability-triage-brocards`와 `agentic-actions-auditor`는 CC-BY-SA-4.0입니다. 원문을 변환·번역해 배포하지 않고 공개된 일반 방법론을 참고해 별도로 작성했습니다. 문서화된 동작이나 수정 비용만으로 사내의 유효한 보안 문제를 기각하는 규칙은 채택하지 않았습니다. `dkleptsov/skill-security-review`(Apache-2.0)는 반입 심사 목적의 참고 후보로 검토했으며 이번 팩에 포함하지 않았습니다.

사용자 캡처의 실제 로그·개인정보 값·사내 서버 경로·시스템명은 저장소에 복사하지 않았습니다. 테스트 자산에는 새로 만든 합성 자료만 들어 있습니다.
