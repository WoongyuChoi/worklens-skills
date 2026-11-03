# 유지보수용 검증

이 폴더는 개발자가 스킬 패키지를 검증할 때 사용합니다.
폐쇄망에 스킬을 복사해서 사용하는 동료는 Node.js나 Playwright를 설치할 필요가 없습니다.

| 명령 | 범위 | 의존성 |
|---|---|---|
| node tests/validate.cjs | 스킬 구조, 참조 경로, 자산 문법과 외부 의존성 | Node.js 기본 모듈 |
| node tests/logic-check.cjs | 자산의 실제 JavaScript 로직 32개 사례 | Node.js 기본 모듈 |
| node --test tests/batch2-tools.test.cjs | 2차 계산 도구 32개 검사, CLI와 브라우저 엔진 일치, 실패/경계값 | Node.js 기본 모듈 |
| node tests/browser-check.cjs | 1차 자산의 브라우저 조작, 입력, 화면 캡처, 외부 요청 확인 | 이미 설치된 Playwright와 Chromium |

logic-check는 최소 DOM 어댑터를 사용하므로 브라우저 실행을 대체하지 않습니다.
테스트 프로그램은 패키지를 자동 설치하거나 네트워크에서 가져오지 않습니다.
fixtures에는 합성 데이터만 있습니다.

2차 계산 엔진 수정 시 `scripts/tool-sources/`를 편집하고 `node scripts/build-offline-tools.cjs`로 각 스킬의 자산을 다시 생성하세요.
사용자는 빌더나 저장소 공통 파일 없이 개별 스킬 폴더만 복사하면 됩니다.
2차 엔진의 Node VM 검사는 브라우저 화면·파일 선택·다운로드 실행 검증을 대신하지 않습니다.

## 3차 추가팩 검사

| 명령 | 범위 | 의존성 |
|---|---|---|
| node --test tests/batch3-evidence.test.cjs | 바이트·덤프·시간표의 계산/오판 방지 29개 | Node.js 기본 모듈 |
| node --test tests/batch3-navigation.test.cjs | 일정·코드 안내의 경계/상한/내장 왕복 24개 | Node.js 기본 모듈 |
| node --test tests/batch3-cli.test.cjs | 선택 CLI 경로·원본 보존·잘못된 UTF-8·HTML 출력 6개 | Node.js 기본 모듈 |
| node tests/batch3-async-dom.cjs | 실제 비동기 실험 HTML 이벤트 11개 | 최소 DOM 어댑터 / Node |
| node tests/batch3-evidence-dom.cjs | 실제 HTML 이벤트·다운로드 데이터·엔진 일치 21개 | 최소 DOM 어댑터 / Node |

기존 64개와 신규 91개, 총 155개 로직/CLI/최소 DOM 검사를 통과했습니다. 스킬 구조 검사와 독립 요청 적용은 이 숫자에 합산하지 않았습니다. 실제 브라우저에서 버튼을 눌러 다운로드한 검증과 Blob 내용을 확인한 최소 DOM 검증을 혼동하지 마세요.

바이트·덤프·시간표 HTML을 수정할 때는 해당 스킬의 `scripts/tool.cjs` 및 저장소 `scripts/evidence-tool-sources/`를 편집한 뒤 다음 빌더로 재생성합니다.

    node scripts/build-evidence-tools.cjs

일정·코드 안내의 core는 `/* BEGIN WORKLENS CORE */`와 `/* END WORKLENS CORE */` 사이에 있습니다. 해당 스킬의 CLI와 HTML core를 함께 갱신하고 navigation 테스트의 바이트 일치 검사를 통과해야 합니다.

`tests/fixtures/batch3-dev/`와 `tests/fixtures/batch3-quality/`는 별도 에이전트에 실제 업무 요청을 적용시키기 위한 합성 원자료입니다. 정답이 있는 문서를 함께 전달하지 않고 각 요청을 수행하게 합니다. 결과는 무시되는 `test-results/`에 저장하며, 사내 Qwen 테스트로 표현하지 않습니다.

## 보안 5개 추가팩 검사

| 명령 | 범위 | 의존성 |
|---|---|---|
| node --test tests/security-api.test.cjs | 접근 통제·신원 교정·원문 비출력·실행 범위 18개 | Node 기본 모듈, 자체 loopback HTTP 서버 |
| node --test tests/security-source.test.cjs | 입력 경로·국소 수정·실행 수준·임시 파일 정리 10개 | Node 기본 모듈 |
| node --test tests/security-dependency.test.cjs | 버전/조건/반증/철회/범위/수정 채널 22개 | Node 기본 모듈 |
| node --test tests/security-agent.test.cjs | 시도·차단·효과·대조군·불완전 trace 14개 | Node 기본 모듈, 합성 기록 |
| node --test tests/security-privacy.test.cjs | 제한된 로그 파싱·원문 비출력·출력 제외·관측 유지 16개 | Node 기본 모듈, 합성 로그 |
| node --test tests/security-report.test.cjs | 공통 형식·안전한 텍스트·필터/coverage·오류 비출력 10개 | Node 기본 모듈, 최소 DOM |

신규 90개와 기존 155개를 다시 실행해 총 245개를 통과했습니다. Node v24.22.1에서 실행했으며 목표 Node 22+ 및 사내 Windows/Qwen 실행 검증과 구분합니다. 구조·독립 요청 적용은 합산하지 않았습니다.

공통 보고서의 소스는 `scripts/security-tool-sources/`입니다. 수정 후 다음을 실행하면 5개 폴더 안에 같은 렌더러가 복제됩니다.

    node scripts/build-security-report.cjs

`tests/fixtures/security-*`는 스킬 적용용 합성 원자료입니다. 스킬을 새 세션에 전달해 예상 진단 없이 요청을 수행하도록 하고, 결과는 무시되는 `test-results/`에 둡니다. 실제 회사 코드·로그·credential은 포함하지 않습니다. 모든 runtime 검사를 사내 서비스 침투 결과로 표현하지 않습니다.

## 배포 파일 재생성

개발 환경에 Python 표준 라이브러리만 있으면 다음으로 목록과 두 ZIP을 다시 생성할 수 있습니다. 스킬 사용자는 이 스크립트가 필요 없습니다.

    python scripts/package-release.py --catalog-only
    python scripts/package-release.py --output /absolute/output/directory

스킬별 필수 자원을 폴더째 담고 ZIP 무결성·스킬 수·참조 파일·SHA-256을 검사합니다. ZIP에는 Git 이력, 테스트 결과, node_modules, CI 환경을 포함하지 않습니다.

기본 출력은 보안 5개 추가팩과 전체 45개 통합팩입니다. 이전 3차 20개/전체 40개 파일은 변경하지 않습니다. 조사 HTML은 `python scripts/build-security-research.py`로 Markdown 원본에서 생성합니다.
