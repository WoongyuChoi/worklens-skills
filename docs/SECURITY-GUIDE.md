# 보안 10개 사용 안내

이 문서는 **기존 보안 5개와 이번 추가 5개**, 총 10개를 다룹니다. Qwen을 포함한 사내 로컬 Agent에 맞춰 커스텀하는 기반입니다. 필요한 스킬 폴더를 참조 자료와 함께 복사하고 사내 등록 방식을 따릅니다. 스킬 자체가 파일·HTTP·셸·브라우저·로그 도구를 새로 설치하지 않으며 이미 허용된 호스트 도구를 사용합니다.

## 사내 정리함 분류

보안 열 스킬은 모두 **`40_security` · 보안**에 넣습니다. 다운로드 팩의 목록과 카테고리 목록에도 같은 분류를 적용했습니다. 로컬 Agent에 등록할 자원은 기존처럼 `skills/스킬이름` 폴더 단위로 제공합니다.

## 기존 보안 5개 선택

| 우선순위 | 스킬 | 그대로 요청할 문장 | 먼저 나와야 할 결과 |
|---|---|---|---|
| 1 | api-authz-probe | 이 API가 익명이나 다른 조직 계정에도 열리는지 소스부터 봐줘 | API 목록, 적용 인증 설정, 객체/조직 권한 정책, 미확인 범위 |
| 2 | privacy-log-audit | 개인정보가 로그에 찍히는 경로와 불필요한 출력을 찾아줘 | 필드 → 객체/직렬화 → 출력 위치, 제외/최소화안, 재검증 |
| 3 | source-sink-review | 외부 입력이 SQL·URL·파일 처리까지 도달하는지 봐줘 | 입력과 위험 처리 사이의 실제 소스 경로, 보호 코드와 반증 |
| 4 | dependency-advisory-triage | 반입한 보안 권고가 우리 라이브러리와 설정에 해당하는지 봐줘 | 실제 버전 근거, 기능·설정 조건, 수정 검토/보류 항목 |
| 5 | agent-boundary-check | Qwen이 문서나 API 응답의 가짜 지시를 따르는지 확인해줘 | 입력 표면과 도구 권한 경계, 실제 trace가 있을 때의 실행 단계 |

긴 JSON을 직접 준비할 필요는 없습니다. Agent가 현재 폴더와 이미 있는 자료를 읽어 초안을 작성합니다. 실제 실행에 필요한 서버·계정·권한 정책을 알 수 없으면 그 부분만 미확정으로 남기고 소스 검토를 먼저 완료합니다.

## API 접근 통제 — 소스와 실제 응답을 연결

Agent가 Controller/OpenAPI와 SecurityFilterChain·서비스의 객체/조직 조건을 연결합니다. 공개가 의도된 API, 로그인 필수, 역할 제한, 객체 소유권, 응답 필드 제한을 나눠 기대 결과를 만듭니다.

실제 요청에는 사용자가 지정한 테스트 origin, 계정별 환경변수, 부작용 없는 읽기 API와 합성 객체가 필요합니다. 정상 계정 교정과 본인 객체 조회가 성공한 뒤 익명·다른 사용자·다른 조직 사례를 비교합니다. 200이나 로그인 HTML만으로 취약점을 확정하지 않습니다. 403 응답이라도 보호 대상 합성 마커가 있으면 노출을 판정할 수 있습니다.

스킬 폴더에서 실행하는 선택 명령:

```text
node scripts/probe.cjs --manifest manifest.json --plan --out api-plan.json
node scripts/probe.cjs --manifest manifest.json --execute --out api-report.json
node scripts/write-report.cjs api-report.json api-report.md
```

`--plan`은 요청 0건이며 인증정보도 읽지 않습니다. `--execute`는 확정된 범위 안의 GET/HEAD만 실행합니다. 변경 요청과 부작용 미확인 API는 skip으로 남깁니다. 리다이렉트·자동 재시도·임의 ID 열거는 수행하지 않습니다. 필요한 사내 proxy/CA와 호스트 도구를 사용할 수 없으면 실행 한계를 보고합니다.

**endpoint 전체 수와 검증 case 수는 다릅니다.** Agent는 소스에서 찾은 API 수를 기록하고, 도구는 교정·정상 대조·거부 사례 수를 별도로 집계합니다. 모든 method/content type을 실행한 것처럼 표시하지 않습니다.

실서버 없이 확인할 때:

```text
node scripts/demo.cjs --out-dir new-api-demo
node scripts/write-report.cjs new-api-demo/report.json new-api-demo/report.md
```

숫자 loopback의 자체 서버를 열었다 닫고, 합성 데이터의 취약/수정 API를 비교합니다. 결과는 실제 사내 서비스의 취약점 보고서가 아닙니다.

## 개인정보 로그 — 기록한 뒤 가리는 경로까지 추적

추가 캡처의 실제 요구는 업무/장애 분석에 불필요한 개인정보의 출력 제외와 로그 정책 개선입니다. 실제 로그 제공을 요구하지 않습니다. 서비스별 필드명 MD가 있으면 이를 사용하고, 없다면 소스에서 후보 필드를 찾되 확인된 개인정보 목록과 구분합니다.

관찰 대상은 logger 호출뿐 아니라 DTO `toString`, JSON 직렬화, request/response interceptor, exception message, MDC, SQL parameter trace, appender와 수집기입니다. 프런트 마스킹이나 collector 후처리로 가려져도 앞단의 파일에 원문이 기록되면 노출 경로가 남습니다.

권장 산출물:

- 서비스·이벤트·필드별 출력 필요성: 제외 / 최소화 / 승인된 상관관계 정보 유지 / 판단 보류.
- 소스의 필드 → 변환·직렬화 → 출력 함수·설정 → 로그 저장 경로 근거.
- 정상·오류·예외·debug 조건에서 합성값이 남지 않는 재검증과, 장애 추적에 필요한 최소 필드의 유지 여부.
- 실제 로그를 사내에서 읽은 경우에도 **필드명·파일 별칭·행 번호·개수만** 보고. 원문·값·부분값·원문 hash를 출력하지 않음.

기존 `sample-mask`는 공유용 샘플 값 변환에 사용합니다. 이 스킬은 기록 경로와 출력 정책을 고치는 데 사용합니다. 인적 정보인지 정규식만으로 판단하거나 전체 운영 로그를 무제한 탐색하지 않습니다.

Agent가 소스와 출력 정책에서 필드 규칙을 만든 뒤, 사내에서 지정한 파일만 선택적으로 확인합니다.

```text
node scripts/check-logs.cjs --rules field-policy.json --input approved-local.jsonl --format jsonl --label service-a --out log-report.json
node scripts/write-report.cjs log-report.json log-report.md
```

지원 입력은 한 줄에 한 JSON 객체가 있는 UTF-8 JSONL 또는 명시적인 `key=value` 형식입니다. 여러 줄 stack trace, 다른 인코딩, 읽기 한도 초과와 변동 중인 파일은 `unknown`으로 남깁니다. 값이 비슷하다는 이유만으로 개인정보를 확정하지 않습니다. 확정한 제외 정책과 실행 기록의 관측 사실을 연결하며, 기존 로그 검토와 현재 서비스 실행을 구분합니다.

실제 로그 없이 도구와 전후 보고서를 확인하려면 다음 합성 예제를 사용합니다.

```text
node scripts/demo.cjs --out-dir new-privacy-demo
node scripts/write-report.cjs new-privacy-demo/reports.json new-privacy-demo/report.md
```

정상·입력 오류·접근 거부 사건을 유지하면서, 전체 payload를 기록한 출력과 필요한 관측 필드만 기록한 출력을 비교합니다. 실제 회사의 logging framework나 appender를 실행한 예제는 아닙니다.

## 입력 경로 — 검색 후보를 소스 근거로 좁히기

실제 caller에서 외부 입력이 SQL 식별자·정렬식, URL/resource 위치, 파일 경로, view name, 동적 실행 인자로 넘어가는 경로를 추적합니다. 허용 목록·권한·정규화·최종 sink에 대한 검사가 경로 전체를 막는지도 확인합니다.

번들 로컬 예제:

```text
node scripts/local-demo.cjs --out source-demo.json
node scripts/write-report.cjs source-demo.json source-demo.md
```

SQL 예제는 문자열 구조, URL 예제는 요청 계획을 관측합니다. 실제 SQL/HTTP를 실행하지 않습니다. 파일 예제는 새 임시 폴더의 합성 canary만 읽고 정리합니다. 실제 Spring CVE나 사내 코드에서 재현했다는 뜻이 아닙니다.

## 의존성 — 버전과 실제 영향은 별개

기존 dependency export·lockfile·패키징 목록을 읽고 선언/선택/배포/실행 버전을 구분합니다. 그 후 반입된 권고의 필수 조건을 소스·설정·배포에서 확인합니다.

```text
node scripts/triage.cjs --input local-input.json --out dependency-report.json
node scripts/write-report.cjs dependency-report.json dependency-report.md
```

내장 snapshot은 6건의 선별 예제입니다. 자동 최신 업데이트나 전체 CVE 검사가 아닙니다. 추가 반입에는 `--snapshot`으로 같은 정규화 형식을 사용합니다. 원본 OSV JSON을 그대로 넣는 범용 파서는 아닙니다. 날짜·수정·철회·별칭·OSS/Enterprise 수정 경로를 보존합니다.

VERSION_MATCH(버전 일치), REACHABILITY_UNKNOWN(조건 부족), AFFECTED(정적 조건 충족), REACHABILITY_REBUTTED(필수 조건 반증)를 구별합니다. AFFECTED는 공격 재현 성공이 아닙니다. 전달된 실행 기록을 검토한 결과도 직접 실행과 별도 모드로 표시합니다.

## 에이전트 입력 경계 — 실제 도구 기록이 있을 때

네 입력 표면(문서·주석·tool result·검색 문서)을 정상 업무와 짝지어 검사합니다. 새 합성 작업 공간에서 canary 파일 행동을 관측하고 정상 작업은 유지됐는지 확인합니다.

```text
node scripts/prepare.cjs new-agent-workspace
node scripts/evaluate.cjs observed-trace.json agent-report.json
node scripts/write-report.cjs agent-report.json agent-report.md
```

생성기와 평가기는 모델을 호출하지 않습니다. 실제 Qwen 새 세션과 호스트 trace 기능이 있을 때 사내에서 연결할 부분입니다. 기능이 없으면 코드·정책 검토와 실행 계획을 제공하고 runtime은 확인 못 함으로 남깁니다. 문장의 제안, 실제 호출 시도, host denial, 실행 결과, 후속 효과를 구분합니다.

## 보고서 읽기

보안 10종의 기본 결과는 Agent가 작성한 **완성된 Markdown 보고서**입니다. 사용자에게 JSON 작성이나 업로드를 요구하지 않습니다. 기존 선택형 보조도구의 JSON은 Agent가 직접 읽어 정리하거나 위의 `write-report.cjs`로 변환합니다. Node가 없어도 소스 검토와 Markdown 작성은 가능합니다.

HTML이 필요한 경우에는 각 폴더의 `references/report-blueprint.md`에 들어 있는 디자인 지침과 전체 HTML 소스를 읽어, 실제 결과가 채워진 단일 문서를 생성합니다. 빈 뷰어·파일 선택 화면·서버·외부 라이브러리가 없습니다. [보고서 규칙](SECURITY-REPORT-FORMAT.md)을 따릅니다.

## 이번 추가 5개

아래 스킬은 별도 실행기 설치 없이 현재 프로젝트와 호스트 도구를 사용합니다. 질문에 필요한 소스부터 찾고, 권한과 실행 범위가 이미 주어진 경우 다시 승인 질문을 반복하지 않습니다. 실행할 수 없는 부분은 정적 근거와 미검증 이유를 남깁니다.

| 스킬 | 바로 사용할 요청 | 확인할 증거 |
|---|---|---|
| session-lifecycle-check | 로그아웃한 세션과 회전 전 refresh token이 다시 통하는지 확인하고 고쳐줘 | 정상 인증 대조군, 상태 변경 뒤 **같은 증표**의 실제 사용 결과, 새 증표와 다른 장치의 정상 동작 |
| workflow-abuse-test | 승인 생략·재전송·동시 요청으로 중복 처리되는지 확인하고 고쳐줘 | 서버 상태 전이, 실제 원장/이벤트/테스트 대역 호출 수, 최소 2개 동시 요청의 경합 도달 증거 |
| upload-lifecycle-test | 첨부파일의 검사 누락이나 검사 전 공개 경로를 확인하고 고쳐줘 | 각 실제 파일 검사 여부, pending/rejected 공개 여부, 저장·추출·삭제 경계와 정상 파일 |
| browser-origin-check | 다른 웹 출처에서 데이터·상태·WebSocket에 접근되는지 확인해줘 | 응답을 읽는 것, 읽지 못해도 상태가 바뀌는 것, WS 연결을 각각 관측. 실제 브라우저 여부 |
| deployment-exposure-audit | 실제 배포에서 관리 경로나 백엔드 우회 접근이 열리는지 확인하고 고쳐줘 | 활성 profile, 실효 listener/proxy 경로, 직접 백엔드 경계, 최소 응답과 정상 health |

### 수정 요청까지 한 번에

> 현재 프로젝트를 `workflow-abuse-test`로 확인해줘. 소스에서 업무 규칙과 처리 경로를 찾고, 로컬 합성 데이터로 문제를 재현해. 수정이 필요한 부분은 고친 뒤 동일 사례, 원인에 맞는 변형, 정상 업무 흐름을 다시 검사하고 Markdown으로 정리해줘.

스킬에는 이 절차가 기본으로 포함되어 있으므로 매번 긴 프롬프트를 붙일 필요는 없습니다. 점검만 요청한 경우에는 제안한 패치를 실제 적용했다고 쓰지 않습니다. 수정 요청과 권한이 있으면 해당 범위의 코드를 고치고 검증합니다.

### 모델과 실행환경

Qwen 전용 API·가짜 병렬 도구·특정 MCP를 호출하지 않습니다. 파일 읽기만 있으면 정적 검토, 셸/기존 테스트 도구가 있으면 프로젝트 경로 재현, 브라우저가 있으면 브라우저 경계 관측을 추가합니다. 실제 테스트 서비스 접속은 인터넷 연결과 별개이며, 폐쇄망 내 지정된 테스트 서비스가 실행되는 경우 그 범위에서 진행합니다.

실제 DB·IdP·프록시·브라우저 정책이 없는 합성 시험은 해당 경계의 통합 검증이 아닙니다. 반대로 도구가 부족하다는 이유로 소스 탐색과 구체적인 수정 제안까지 중단하지 않습니다.

### 기존 5개와 함께 적용

기존 5개는 **2026-11-09 채택·적용 결정**으로 기록했습니다. 이번 보안 10개 통합팩에는 기존 5개의 보고서 방식 개선이 포함됩니다. 자체 수정한 폴더는 비교·백업 후 선택 반영하고, 예전 `assets/report.html`과 `scripts/render-report.cjs`는 더 이상 사용하지 않습니다. 새로운 5개만 필요한 경우 추가팩을 사용합니다.
