# Worklens Skills

**짧게 요청하고, 한눈에 파악하고, 확인한 결과를 받습니다.**

폐쇄망의 Qwen CLI에서 쓸 수 있도록 구성한 스킬 20개입니다.
실행 지침은 영어, 사용자가 보는 질문과 결과는 한국어입니다.
Git, CI/CD, DB 연결이나 패키지 설치를 기본 전제로 삼지 않습니다.

**✅ 기존 10개 사내 반영 완료** — 2026-09-28 사용자 확인.
기존 10개의 실무 적용 가능 평가는 **6/10개**입니다. 반영 여부와 유용성 평가는 구분합니다.
[반영 상태와 피드백](docs/ADOPTION.md) · [2차 추가 10개의 설계와 출처](docs/NEXT-SKILLS.md)

## 무엇을 말하면 되나요?

| 하고 싶은 일 | 이렇게 요청하세요 | 스킬 | 사내 반영 |
|---|---|---|---|
| 파일 탐색 | 이 파일 좀 보기 좋게 | [file-explorer](skills/file-explorer/SKILL.md) | ✅ 완료 |
| 화면 시안 | 이 기능 화면으로 보여줘 | [screen-prototype](skills/screen-prototype/SKILL.md) | ✅ 완료 |
| 반복 작업 도구 | 방금 한 거 다음에도 쓰게 만들어줘 | [task-to-tool](skills/task-to-tool/SKILL.md) | ✅ 완료 |
| 리더용 요약 | 팀장님께 보여주게 한눈에 정리해줘 | [visual-brief](skills/visual-brief/SKILL.md) | ✅ 완료 |
| 흐름과 관계 | 이 흐름 그림으로 보여줘 | [diagram-maker](skills/diagram-maker/SKILL.md) | ✅ 완료 |
| 개발과 검증 | 이 기능 개발하고 QA까지 해줘 | [dev-conductor](skills/dev-conductor/SKILL.md) | ✅ 완료 |
| 작업 QA | 방금 만든 거 진짜 동작하는지 봐줘 | [qa-sweep](skills/qa-sweep/SKILL.md) | ✅ 완료 |
| 일괄 처리 | 이 방식으로 나머지도 처리해줘 | [parallel-batch](skills/parallel-batch/SKILL.md) | ✅ 완료 |
| 다음 세션 | 하던 작업 이어서 해줘 | [session-handoff](skills/session-handoff/SKILL.md) | ✅ 완료 |
| 규칙 기억 | 다음부터 이 프로젝트에서는 이렇게 해줘 | [project-playbook](skills/project-playbook/SKILL.md) | ✅ 완료 |

dev-conductor와 parallel-batch는 사용자 피드백에 따라 신규 도입 추천 우선순위를 낮췄습니다.

## 2차 추가 — 구현 완료, 사내 반영 대기

새 10개는 2026-09-28 추가했습니다. 아래의 대기는 스킬 제작 상태가 아니라 사내 반입 상태입니다.

| 하고 싶은 일 | 이렇게 요청하세요 | 스킬 | 사내 반영 |
|---|---|---|---|
| 데이터 대조 | 이 두 파일 안 맞는 것만 찾아줘 | [data-reconcile](skills/data-reconcile/SKILL.md) | ☐ 대기 |
| 테스트 데이터 세트 | 이 입력 테스트할 데이터 만들어줘 | [fixture-factory](skills/fixture-factory/SKILL.md) | ☐ 대기 |
| 기존 화면 다듬기 | 이 화면 좀 덜 답답하게 다듬어줘 | [ui-polish](skills/ui-polish/SKILL.md) | ☐ 대기 |
| 업무 조건표 | 이 로직 조건별로 표로 뽑아줘 | [rule-matrix](skills/rule-matrix/SKILL.md) | ☐ 대기 |
| 환경설정 대조 | 개발이랑 운영 설정 다른 것만 보여줘 | [config-compare](skills/config-compare/SKILL.md) | ☐ 대기 |
| 문서와 구현 대조 | 이 설명서 지금 코드랑 맞아? | [doc-drift](skills/doc-drift/SKILL.md) | ☐ 대기 |
| 숫자 변동 분해 | 이번 숫자 왜 달라졌는지 풀어줘 | [variance-bridge](skills/variance-bridge/SKILL.md) | ☐ 대기 |
| 현업 확인표 | 현업한테 확인받을 표 만들어줘 | [acceptance-kit](skills/acceptance-kit/SKILL.md) | ☐ 대기 |
| 조건 조합 압축 | 조합이 너무 많으니 줄여줘 | [pairwise-cases](skills/pairwise-cases/SKILL.md) | ☐ 대기 |
| 로그와 샘플 가명처리 | 식별정보 가려서 공유본 만들어줘 | [sample-mask](skills/sample-mask/SKILL.md) | ☐ 대기 |

이번 요청에서 명시한 경로, 현재 대화, 현재 프로젝트 폴더 순으로 대상을 찾습니다.
후보가 여러 개면 짧은 선택 질문을 합니다. CLI가 IDE에서 선택한 파일을 안다고 가정하지 않습니다.

## 처음에는 이 세 가지

- **파일 탐색:** 작은 내용은 CLI에 바로 표시합니다. 검색과 필터가 유용하면 파일 뷰어를 만듭니다.
- **화면 시안:** 클릭, 검색, 입력, 검증이 되는 화면을 만듭니다. 실제 서버와 연결하지 않는 예시 화면입니다.
- **반복 작업 도구:** 이미 대화에서 확정한 처리 규칙을 꺼내 재사용 가능한 도구로 만듭니다.

바로 열어볼 수 있는 템플릿도 포함했습니다. 아래 파일을 내려받아 브라우저로 열면 됩니다.
GitHub 파일 화면 자체는 HTML 실행 화면이 아닙니다.

| 템플릿 | 실제 가능한 동작 |
|---|---|
| [파일 뷰어](skills/file-explorer/assets/viewer.html) | CSV/TSV/JSON/XML/텍스트 열기, 검색, 페이지 이동, 원문 보기 |
| [화면 시안](skills/screen-prototype/assets/prototype.html) | 검색, 상태 필터, 추가, 수정, 입력 검증, 초기화 |
| [텍스트 도구](skills/task-to-tool/assets/text-tool.html) | 명시적으로 선택한 공백/빈 줄/중복 처리, 결과 복사, 파일 저장 |
| [도식 예시](skills/diagram-maker/assets/diagram-shell.html) | 외부 라이브러리 없는 SVG 흐름도 |

## 계산용 도구 5개

스킬이 대화와 파일에서 입력을 파악하고 아래 도구로 계산합니다.
Node.js 18+가 이미 있으면 `scripts/tool.cjs`를 CLI에서 실행할 수 있습니다.
없으면 각 폴더의 `assets/tool.html`을 브라우저에서 열 수 있으며, 추가 설치는 필요하지 않습니다.
도구를 만들어 전달한 것과 사용자 데이터 처리를 완료한 것은 구분합니다.

| 도구 | 지원 범위 |
|---|---|
| [데이터 대조](skills/data-reconcile/assets/tool.html) | CSV/TSV/JSON, 복합 키, 누락/중복/값 차이 |
| [환경설정 대조](skills/config-compare/assets/tool.html) | JSON/단순 properties, 기본값 숨김, 변수 미해결 표시 |
| [숫자 변동 분해](skills/variance-bridge/assets/tool.html) | 항목별 CSV, 정확한 십진수 증감과 합계 검산 |
| [조건 조합 압축](skills/pairwise-cases/assets/tool.html) | 제외 조건·필수 조합을 반영한 조건 쌍 커버리지 |
| [로그·샘플 가명처리](skills/sample-mask/assets/tool.html) | 지정 문자열과 식별정보 후보를 일관된 토큰으로 치환 |

입력 파일은 UTF-8, 하나당 2 MiB이며 도구별 추가 한도가 있습니다.
JSON 결과는 원래 값을 보존하고, CSV 결과는 스프레드시트 수식 오해를 막기 위해 일부 셀 앞에 작은따옴표를 붙입니다.
환경설정의 최종 런타임 값, 완전 익명화, 모든 테스트 조합 검증은 보장하지 않습니다.

## 폐쇄망에 가져가기

1. GitHub의 **Code → Download ZIP**으로 내려받습니다.
2. 내부 반입 후 압축을 풉니다.
3. 원하는 스킬 폴더를 **폴더째** Qwen의 스킬 위치에 복사합니다. SKILL.md만 복사하면 템플릿이 빠집니다.

| 적용 범위 | 위치 |
|---|---|
| Windows 사용자 공통 | %USERPROFILE%\.qwen\skills\스킬이름\SKILL.md |
| Linux 사용자 공통 | ~/.qwen/skills/스킬이름/SKILL.md |
| 현재 프로젝트만 | 프로젝트폴더/.qwen/skills/스킬이름/SKILL.md |

Windows cmd에서 압축을 푼 저장소 폴더에 들어간 뒤, 예를 들어 파일 탐색 스킬만 복사하려면:

    xcopy "skills\file-explorer" "%USERPROFILE%\.qwen\skills\file-explorer" /E /I /-Y

20개 전체를 복사하려면:

    xcopy "skills" "%USERPROFILE%\.qwen\skills" /E /I /-Y

같은 이름의 파일이 있으면 덮어쓰기 여부를 확인합니다.
사용 중인 Qwen Code 버전에서 지원하면 /skills로 등록 상태를 확인하세요.
자동 선택이 불안정하면 “file-explorer 스킬로 이 파일을 보여줘”처럼 이름을 함께 말할 수 있습니다.
agents/openai.yaml은 다른 도구와의 호환용 메타데이터이며 Qwen 사용에 필수는 아닙니다.

## 출력은 필요한 만큼

- 짧은 결과: CLI 결론 한 줄과 작은 표
- 관계 설명: 간단한 흐름은 단계 목록, 분기가 있으면 도식
- 탐색과 조작: 필요한 경우에만 HTML
- 확인 수준: **실행 확인 / 정적 확인 / 실패 / 확인 못 함** 구분

HTML은 외부 CDN, 폰트, 서버 없이 file://로 열립니다.
파일 뷰어는 파일 선택 방식이며 원본을 수정하지 않습니다. 파일 크기는 5 MiB, 레코드는 20,000개로 제한합니다.
XLSX나 PDF를 직접 파싱하는 템플릿은 아닙니다.

## 개발과 QA는 어떻게 나누나요?

현재 사용자 환경에서는 dev-conductor와 parallel-batch의 효용이 낮다는 피드백이 있습니다.
아래 내용은 구현된 동작 설명이며, 신규 도입의 우선 추천 항목은 아닙니다.

dev-conductor는 요청을 파악하고 관련 파일을 읽은 다음 구현, 검토, 실제 검증을 연결합니다.
기본은 **작성 담당 1명과 읽기 전용 검토 최대 2개**입니다.
독립된 조사와 검토는 실제 에이전트 기능이 있을 때 병렬로 실행합니다.
기능이 없으면 순차 진행합니다. 같은 파일, 공통 설정, 테스트 자원을 동시에 수정하지 않습니다.

스킬 파일 자체가 병렬 실행 기능을 추가하지는 않습니다.
사내 Qwen CLI 버전, 도구 노출과 모델 서버 수용량에 따라 실행 방식과 속도가 달라집니다.
빌드 도구나 브라우저가 없으면 해당 검증을 못 했다고 표시하고, 통과로 처리하지 않습니다.

## 참고와 검증

- [출처와 사내 환경에 맞춘 변경점](docs/SOURCES.md)
- [검증 결과와 남은 확인](docs/VALIDATION.md)
- [짧은 요청으로 해보는 사용 시나리오](docs/TRY-IT.md)

외부 프로젝트의 원문을 그대로 설치하는 패키지가 아닙니다.
공개된 절차를 참고해 폐쇄망, 한국어 결과, 짧은 요청에 맞춰 새로 작성했습니다.
사내 Qwen 모델의 실제 성능은 내부 파일로 확인해야 합니다.
