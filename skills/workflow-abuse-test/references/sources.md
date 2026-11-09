# 업무 흐름 조사 근거

조사 기준일: **2026-11-09**. 공식 자료의 상태 전이·재생·경합 검증 원리를 바탕으로 자체 작성한 스킬이다. 외부 제품 코드나 스킬 지침을 복사하지 않았고 실행 중 조회나 도구 설치를 요구하지 않는다.

| 자료 | 공개·갱신일 | 확인 조건과 반영점 |
| --- | --- | --- |
| [OWASP Business Logic Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Business_Logic_Security_Cheat_Sheet.html) | 2026-04-26 신규 추가, 2026-10-04 관련 개정 | 상태 전이와 멱등성 기준. 키는 호출자·작업·원래 매개변수에 결합하고 결과 반환 전 권한을 확인한다. 로컬 트랜잭션만으로 외부 효과를 원자화할 수 없다는 한계를 반영했다. |
| [AVideo GHSA-q77r-9mjq-mjw6](https://github.com/WWBN/AVideo/security/advisories/GHSA-q77r-9mjq-mjw6) | 2026-10-22 공개 | v29.4.0 결제 알림은 순차 재생을 막지만 동시 처리에서 중복 효과 가능. 원래 handler와 결정적 대역으로 확인했으며 실제 PayPal/DB 영향은 조건부다. 공식 수정 버전은 `None`. 합성 재현과 운영 증거를 구분한다. |
| [Paymenter GHSA-pgcq-8grm-5rx9](https://github.com/Paymenter/Paymenter/security/advisories/GHSA-pgcq-8grm-5rx9) | 2026-06-30 공개 | 트랜잭션 밖의 행 잠금이 잔액 중복 사용을 막지 못한 사례. 영향 `<=1.5.4`, 수정 `1.5.5`. 잠금 함수 이름보다 실제 경계와 커밋 효과를 확인한다. |
| [PortSwigger: Race conditions](https://portswigger.net/web-security/race-conditions) | 2023 연구 기반 — 기존 방법론 | 정상 기준선과 실제 효과를 비교하는 방법론만 참고한다. 고속 전송·대량 요청·Burp를 요구하지 않으며 최신 사건으로 소개하지 않는다. |

## OWASP 날짜의 원자료

공식 GitHub API에서 commit 날짜와 diff를 확인했다.

- [멱등성 범위·동시성·재시도 한계 개정](https://github.com/OWASP/CheatSheetSeries/commit/0c295f463b8bc5da21b43b9186f3dab8052a0c1f): `2026-10-04T19:26:38Z`.
- [자동 탐지 한계 표현 개정](https://github.com/OWASP/CheatSheetSeries/commit/e39e5f6de8969ff27259fab21030e45cb7baaec2): `2026-10-04T19:26:32Z`. 도구가 업무 결함을 전혀 못 찾는다는 단정 대신 업무 규칙을 결합한 검증을 권한다.
- [문서 최초 추가](https://github.com/OWASP/CheatSheetSeries/commit/d48313bb2a03f78be4bbaae7fc6ba8795ef79a9c): `2026-04-26T22:19:55Z`.

실제 소스·업무 정책·실행 증거가 연결된 경우에만 해당 환경의 결함으로 보고한다. 위 제품을 사내에서 사용한다거나 같은 취약점이 발생했다는 뜻은 아니다.
