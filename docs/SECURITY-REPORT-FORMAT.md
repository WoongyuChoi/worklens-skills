# 공통 보안 보고서 형식

다섯 스킬은 `worklens-security-report/v1` JSON을 만들고, 각 폴더에 포함된 `assets/report.html`에서 열 수 있습니다. HTML은 네트워크 요청을 하지 않습니다. 이미 설치된 Node가 있으면 `node scripts/render-report.cjs report.json new-report.html`로 데이터가 내장된 단일 HTML을 만듭니다. 명령은 스킬 폴더에서 실행하며 기존 출력 파일을 덮어쓰지 않습니다.

| 필드 | 내용 |
|---|---|
| title / skill / generatedAt | 보고서 제목·작성 스킬·생성 시각 |
| mode | static(정적 검토), local-demo(합성 예제), authorized-live(지정 범위 직접 실행), evidence-review(제공된 실행 기록 검토) |
| scope | description, targets 문자열 배열, vantage 관측 위치, limitations 문자열 배열 |
| findings | id, title, severity, status, summary, evidence, conditions, fix, retest, flow |
| evidence | kind(source/runtime/trace/advisory), location, detail |
| coverage | target, status, detail. 성공 사례뿐 아니라 미실행 대상·이유도 포함 |
| sources | title, url, publishedAt, retrievedAt |

`status`는 confirmed / suspected / not-reproduced / unknown / not-applicable 중 하나입니다. confirmed에는 runtime 또는 trace 근거와 실행 모드가 필요합니다. **local-demo의 confirmed는 예제에서 관측한 사실**이며 실제 사내 취약점을 의미하지 않습니다. 정적 적용 조건이 성립한 dependency AFFECTED는 suspected와 별도 triageState로 표시합니다. 결과가 없다는 사실을 전체 안전 판정으로 바꾸지 않습니다.

심각도와 확인 상태는 서로 다릅니다. high + suspected는 잠재 영향이 크지만 실행 검증이 부족한 항목입니다. 숫자 CVSS는 해당 근거와 범위가 있을 때만 별도로 기록하며 이 뷰어가 임의 계산하지 않습니다.

여러 보고서는 JSON 배열로 묶거나 파일을 함께 선택해 볼 수 있습니다. 검색·판정 필터를 적용해도 전체 집계와 coverage를 숨기지 않습니다. JSON 저장 시 추가 메타데이터를 보존합니다. 입력은 총 4MB, 최대 20개 보고서, 보고서당 1000개 finding으로 제한합니다.

보고서에 실제 토큰·cookie·개인정보 원문을 넣지 않습니다. evidence에는 파일/줄, 통제된 마커의 관측 여부, 상태·조건·차단 사유를 기록합니다. HTML은 문자열을 텍스트로 표시하며 source 링크도 HTTP(S)만 허용합니다. 입력 보고서의 사실관계까지 자동 검증하는 도구는 아닙니다.
