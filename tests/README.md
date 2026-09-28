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
