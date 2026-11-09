# 폐쇄망 Agent 보안 스킬 추가 5종 조사·설계

조사 기준일: **2026-11-09**. 카테고리: **40_security**.

## 선정 결과

이번에는 세션, 업무 흐름, 첨부파일, 브라우저 출처, 배포 진입점이라는 **서로 다른 보안 경계 다섯 개**를 선정했습니다. 최신 공개 Agent 스킬의 재현·수정·검증 절차와 최근 제조사 공지를 검토하여, 폐쇄망에서 기존 프로젝트 도구로 수행할 수 있는 작업 단위로 독립 작성했습니다.

| 스킬 | 확인하는 업무 문제 | 기존과 겹치지 않는 핵심 | 우선 적용할 곳 |
|---|---|---|---|
| session-lifecycle-check | 로그아웃·회전·복구 뒤에도 이전 증표 사용 | 현재 권한 판정이 아니라 **인증 상태 변경 전후의 지속성** | 로그인·SSO·비밀번호 복구가 있는 서비스 |
| workflow-abuse-test | 승인 생략·재시도·동시 요청으로 중복 효과 | 정적 규칙 목록이 아니라 **잘못된 순서와 경합의 실제 결과** | 승인, 지급, 배정, 쿠폰, 정산, 상태 전이 |
| upload-lifecycle-test | 일부 파일 검사 누락, 검사 전 공개, 경로 이탈 | 단일 함수보다 **접수→검사→저장→공개→삭제의 동일 파일** | 첨부·증빙·미리보기·일괄 파일 반입 |
| browser-origin-check | 다른 출처가 사용자 브라우저를 통해 읽기·변경·WS 연결 | 계정 권한과 구별되는 **웹 origin의 권한** | 쿠키 기반 웹, WebSocket, 로컬 보조 서비스 |
| deployment-exposure-audit | 관리면·직접 백엔드·잘못된 활성 설정 | 소스 기본값과 다른 **실제 배포의 진입점과 신뢰 설정** | 프록시 뒤 서비스, 관리 포트, 개발/운영 profile |

기존 45개와 이름이 겹치지 않습니다. 기존 `api-authz-probe`, `source-sink-review`, `dependency-advisory-triage`, `invariant-tests`, `transaction-boundary`, `config-compare`와 역할을 대조했습니다. 관련 경계의 연계는 가능하지만 같은 보고서를 이름만 바꾸어 다섯 번 만드는 구조는 피했습니다.

## 최근 자료에서 무엇을 취했는가

### 실제 공개 Agent 스킬과 실행 프롬프트

| 원자료 | 확인된 시점·형식 | 가져온 판단 원칙 | 사내 반입 설계 |
|---|---|---|---|
| Trail of Bits `patching-bugs` | **2026-10-20 UTC 추가**(한국 시간 10-21), 실제 SKILL.md | 수정 전 증거, 독립 검증, 최소 원인 수정, 수정 후 같은 재현과 회귀 | Git·uv·별도 plugin·다중 Agent를 필수화하지 않고 증거 절차만 독립 작성 |
| Trail of Bits `post-patch-validation` | **2026-09-14 UTC 수정**(한국 시간 09-15), 실제 SKILL.md. 신규 발명일을 뜻하지 않음 | 놓친 변형·회귀·검증 공백을 명시 | 같은 사례+원인 기반 변형+정상 대조군을 공통 완료 조건으로 채택 |
| Strix `web-app-penetration-testing`, `fix-security-vulnerabilities-with-strix` | **2026-09-01 UTC 관련 스킬 변경**(한국 시간 09-02), 실제 SKILL.md | 소스와 실행 증거를 연결하고 수정 후 실제 PoC를 재검증 | 자체 호스팅 CLI/컨테이너 또는 관리형 서비스 연결은 팩에 포함하지 않음 |
| Shannon 3.0의 인증·기타 취약점 프롬프트 | **2026-09-02 구조 변경**, SKILL.md가 아닌 실행 프롬프트 | 상태 변경·증표 재사용·업무 효과를 추적하는 질문 방식 | Docker worker·모델 설정·전용 도구를 전제하지 않는 지침으로 재설계 |
| Trail of Bits `insecure-defaults` | **2026-08-05 workflow 전환**. 현재는 명령·workflow 구조 | 기본값→보안 결정→실효 설정·오류 경로 추적 | Claude 전용 workflow를 복제하지 않고 배포 경계 절차에 반영 |

최신성은 저장소 전체의 push 시간이나 별 개수로 판정하지 않았습니다. 관련 파일의 실제 변경 commit과 내용으로 구분했습니다. Strix의 자체 호스팅 모드와 Shannon의 로컬 모델 지원 가능성을 인정하되, 이미 사내 Agent가 있는 상황에서 별도 플랫폼을 추가하는 비용이 적합한지 따로 판단했습니다.

원본 링크와 확인한 commit:

- [ToB patching-bugs 원본](https://github.com/trailofbits/skills/blob/e4dd0bb5b15535f7c5a0834187dffba6ac37e4ff/plugins/patching-bugs/skills/patching-bugs/SKILL.md), [추가 commit a313174](https://github.com/trailofbits/skills/commit/a3131740a39291e42fd15b9eac07e0b393ad71b1).
- [ToB post-patch-validation 원본](https://github.com/trailofbits/skills/blob/e4dd0bb5b15535f7c5a0834187dffba6ac37e4ff/plugins/post-patch-validation/skills/post-patch-validation/SKILL.md), [관련 수정 commit 027bc47](https://github.com/trailofbits/skills/commit/027bc47a69a276c340717bafdc3708263094b9a4).
- [Strix 공식 스킬 목록](https://github.com/usestrix/strix/blob/215482eb2204cd30ac6b87520e3f5c6511e2e2e8/docs/integrations/coding-agents.mdx), [수정 검증 스킬](https://github.com/usestrix/strix/blob/215482eb2204cd30ac6b87520e3f5c6511e2e2e8/skills/fix-security-vulnerabilities-with-strix/SKILL.md), [관련 commit 42baa7c](https://github.com/usestrix/strix/commit/42baa7c09eb567bf15c19b627cb73b1de94a2aa3).
- [Shannon 인증 프롬프트](https://github.com/KeygraphHQ/shannon/blob/4cef63e5900c9eda0b259a44f89458c7f8b1e10d/apps/worker/prompts/exploit-auth.txt), [3.0 commit 9767ebe](https://github.com/KeygraphHQ/shannon/commit/9767ebe633fe4c1cc73a7a74e8a7798c128b7e57).
- [ToB insecure-defaults 변경](https://github.com/trailofbits/skills/commit/82e8e0ad7791805662aa5570230c64c8b8b9ee16).

ToB는 CC-BY-SA-4.0, Strix는 Apache-2.0, Shannon은 AGPL-3.0으로 확인했습니다. 외부 SKILL 본문·코드·공격 프롬프트를 번역 복사하거나 묶어 배포하지 않습니다. 여기의 지침·합성 예제·출력 설계는 독립 작성했습니다. 원본 자체를 사내로 반입할 때는 각 원본의 별도 라이선스 조건을 따릅니다.

### 최근 공개 보안 사례와 적용 조건

| 자료 | 정확한 날짜 의미 | 이번 스킬에 반영한 내용 |
|---|---|---|
| [Keycloak 재사용 보호 우회](https://github.com/keycloak/keycloak/security/advisories/GHSA-xpwp-2pcm-8xq3) | **2026-09-16 공개** | stateless+MySQL/MariaDB의 행 수 의미 차이. 소스에 소비 플래그가 있어도 두 번째 실제 사용이 막히는지 확인 |
| [Keycloak 복구 흐름 이슈](https://github.com/keycloak/keycloak/issues/51833), [26.7.2 릴리스](https://www.keycloak.org/2026/08/keycloak-2672-released) | **2026-08-19 이슈·릴리스** | 요구된 이메일 검증 없이 복구가 진행될 수 있는 경계. 화면 순서와 서버 검증을 분리 |
| [OWASP Business Logic Security](https://cheatsheetseries.owasp.org/cheatsheets/Business_Logic_Security_Cheat_Sheet.html), [멱등성 보완 commit](https://github.com/OWASP/CheatSheetSeries/commit/0c295f463b8bc5da21b43b9186f3dab8052a0c1f) | **2026-10-04 UTC 내용 수정**(한국 시간 10-05). 문서 최초 추가는 4월 | 키를 호출자·작업·원래 매개변수에 결합. 동시 시작을 원자적으로 제어. 로컬 DB 트랜잭션이 외부 부작용까지 원자적으로 만들지는 않음 |
| [AVideo 결제 알림 중복 처리](https://github.com/WWBN/AVideo/security/advisories/GHSA-q77r-9mjq-mjw6) | **2026-10-22 제조사 공개**. 11월 CVE 집계일과 구분 | 순차 재생은 차단하지만 동시 두 요청은 중복 효과. 실제 handler와 결정적 DB/결제 대역의 증거이며 실제 연동 영향은 조건부 |
| [Appium ZIP symlink chain](https://github.com/appium/appium/security/advisories/GHSA-hm39-rvcc-qph6), [Windows drive-relative 변형](https://github.com/appium/appium/security/advisories/GHSA-jx6v-jmqp-x365) | **2026-10-27 공개** | 문자열 경로 정규화와 실제 파일시스템 해석의 차이. Windows 조건은 Linux 시험으로 확인했다고 쓰지 않음 |
| [CodeIgniter 공식 변경기록](https://github.com/codeigniter4/CodeIgniter4/blob/develop/CHANGELOG.md), [공식 권고 목록](https://github.com/codeigniter4/CodeIgniter4/security/advisories) | **2026-10-09 관련 권고 공개** | optional 다중 파일 입력의 빈 항목이 뒤 파일 검사를 생략하는 경계. 각 non-empty 파일을 따로 확인 |
| [Appium WebSocket Origin](https://github.com/appium/appium/security/advisories/GHSA-x5w7-48pf-h23p) | **2026-10-27 공개** | HTTP의 CORS와 WebSocket upgrade의 Origin 검사를 구분. 원문이 설명한 현존 endpoint의 영향 제한을 보존 |
| [Chrome Modern Web Guidance: LNA](https://developer.chrome.com/docs/modern-web-guidance/guides/security/local-network-access) | **2026-10-07 문서 갱신** | AI coding Agent용 공식 지침. 두 localhost origin 실험과 public→local 권한 경계를 구분 |
| [Tomcat Security Considerations](https://tomcat.apache.org/tomcat-11.0-doc/security-howto.html) | 문서 **11.0.27 / 2026-10-06 버전 표기**, 취약점 공개일 아님 | embedded와 일반 기동 기본값의 차이, proxy·servlet 경로 해석, backend 자체 보호 |

이 사례들은 현재 사내 시스템에 같은 제품·버전·설정·취약점이 존재한다는 뜻이 아닙니다. 점검할 경계를 고르는 근거입니다. 특정 CVE 적용 여부는 기존 `dependency-advisory-triage`에 맡깁니다. [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html) 같은 2025 기준은 유효한 정책 기준으로 활용하되 새 사건으로 소개하지 않습니다.

## 폐쇄망에서 실제로 하는 일

스킬은 현재 프로젝트에서 관련 파일, 업무 정책, 정상 테스트, 기존 실행 도구를 먼저 찾습니다. Agent에게 긴 manifest를 작성해 오라고 사용자를 돌려보내지 않습니다. 일반적인 흐름은 **경계 식별 → 최소 재현 → 원인 수정 → 같은 사례·변형·정상 경로 재검증 → 보고서**입니다.

실행 도구가 없는 환경에서는 정적 판단과 적용할 수정, 아직 확인하지 못한 검증을 구체적으로 남깁니다. 로컬 셸이 있으면 기존 언어와 테스트 경로를 재사용합니다. 브라우저가 있어야 확인할 쿠키·출처 동작을 HTTP 클라이언트만으로 완료했다고 쓰지 않습니다. 외부 패키지 설치나 자동 다운로드는 필요하지 않습니다.

모의해킹은 발견된 해당 경계에서 작은 합성 데이터와 지정된 테스트 범위로 수행합니다. 승인 업무 예제는 실제 지급 대신 합성 원장 횟수를 관찰하고, 업로드 예제는 작은 텍스트 표식을 사용합니다. 배포 점검은 소스·설정에서 확인된 경로를 대상으로 하며 임의의 망 전체 검색을 만들지 않습니다. 테스트가 필요한 이유와 업무 영향이 명확한 사례에 집중합니다.

## 출력 방식 변경

기존 보안 5개와 이번 5개 모두 **Markdown 기본**입니다. 기존 5개의 `assets/report.html`, `scripts/render-report.cjs`를 제거했습니다. 검사 보조도구는 남기되 결과 JSON은 Agent의 중간 자료이며, 선택적인 `write-report.cjs`가 완성된 Markdown을 만듭니다.

각 스킬의 `references/report-blueprint.md`에 디자인 규칙과 전체 HTML 소스를 넣었습니다. HTML이 필요하면 Agent가 실제 결과를 이미 채운 단일 문서를 생성합니다. 파일 선택·JSON 업로드·외부 폰트·CDN이 없습니다. 보안 추가팩과 보안 통합팩에는 독립 `.html` 파일을 동봉하지 않습니다.

이 구조는 특정 호스트의 JSON viewer나 Qwen 도구 API에 묶이지 않습니다. 다만 모든 모델·Agent 제품의 자동 skill 선택, 파일 접근, 도구 권한이 실제 검증되었다는 뜻은 아닙니다. 사내 호스트에 맞춘 등록과 실행 검증이 필요합니다.

## 이번에 제외한 방향

- 범용 “OWASP Top 10 점검” 한 장: 구체적인 처리 경로와 업무 효과가 흐려져 제외.
- 기존 API 권한·입력 경로·라이브러리 CVE의 재포장: 이미 보안 1차가 담당.
- 새 클라우드 스캐너·컨테이너 플랫폼을 깔아야 하는 통합팩: 현재 폐쇄망·로컬 Agent 조건에 추가 부담.
- 발견 건수 중심의 자동 보고서: 재현되지 않은 항목과 검증 공백이 가려질 수 있어 제외.
- HTML 업로더를 개선해서 다시 제공하는 방식: 사용자 피드백에 따라 제거하고 Markdown 직접 작성으로 변경.

## 검증과 채택 판단

유지관리 검사 96개와 합성 프로젝트 적용 검사 86개를 구분해 [검증 기록](VALIDATION.md)에 남겼습니다. 새 스킬 5종으로 실제 합성 소스를 수정하고 동일 사례·변형·정상 경로를 다시 실행했습니다. 브라우저 32개는 서버 측 HTTP/TCP 정책 검증이며, Chromium은 호스트 권한 제한으로 시작되지 않아 실제 브라우저 동작과 HTML 시각적 렌더링은 미검증입니다. 로컬 합성 프로젝트에 스킬을 적용하여 소스를 수정하는 절차와, 보고서 출력 변경을 각각 검증합니다. 회사 시스템·실로그·사내 Qwen에는 접속하지 않았습니다.

첫 적용은 로그인 또는 첨부 처리처럼 작은 실제 업무 한 곳으로 시작하는 것이 좋습니다. 기능에 맞는 스킬 하나를 선택하고 **유효한 발견 1건의 근거, 수정의 적절성, 재검증, 정상 기능 보존**을 평가합니다. 기능이 없는 서비스에서는 해당 스킬을 억지로 수행하지 않습니다. 기존 스킬과 똑같은 결과만 내거나 Agent 기본 응답보다 준비 부담이 커지면 통합·제외 판단을 내립니다.
