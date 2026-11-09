# 브라우저 출처 경계 검사 참고 자료

확인 기준일: **2026-11-09**. 공식 문서와 유지관리자 권고를 바탕으로 검사 절차를 독립 작성했습니다. 원문 코드·전체 지침을 복사하지 않았고, 자료 URL은 출처 확인용입니다. 폐쇄망 실행에 인터넷 조회가 필요하지 않습니다.

| 자료 | 날짜의 의미 | 검사에 반영한 관점 |
| --- | --- | --- |
| [Appium: WebSocket upgrades are accepted without an Origin check](https://github.com/appium/appium/security/advisories/GHSA-x5w7-48pf-h23p) | 2026-10-27 공개 | HTTP CORS와 WebSocket upgrade의 출처 검사를 별도로 확인합니다. 원문이 설명한 현존 endpoint 영향은 제한적이므로, 이 사례만으로 다른 시스템의 임의 실행·전체 침해를 주장하지 않습니다. |
| [Chrome: Local Network Access](https://developer.chrome.com/docs/modern-web-guidance/guides/security/local-network-access) | 2026-10-07 문서 갱신 | public/local/loopback 주소 공간, LNA와 CORS의 별도 역할, localhost 시험의 한계를 반영했습니다. 사내 실제 브라우저 버전·정책을 확인하고 문서 최신 기능 지원을 가정하지 않습니다. |
| [GoogleChrome Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance) | 2026-11-09 현재 공개 프로젝트 확인 | Chrome 공식 문서가 연결하는 AI coding agent용 가이드입니다. 필요한 지식을 Markdown으로 제공하는 구성을 참고했으며, 설치나 런타임 종속성으로 추가하지 않았습니다. |
| [Netty: Security Control Bypass via CORS Short-Circuit Failure](https://github.com/netty/netty/security/advisories/GHSA-6cqp-g7gg-8hr5) | 2026-07-20 공개, CVE-2026-56746 | literal `null` Origin의 처리와, 응답 읽기 차단 여부와 별개로 요청이 실제 백엔드에 도달했는지를 구분합니다. |

Chrome 문서는 AI coding agents용이라고 명시하며, loopback에서 시작하는 요청은 더 사적인 주소 공간으로 이동하지 않으므로 일반 localhost 시험만으로 LNA를 검증할 수 없다고 설명합니다. 문서의 갱신일을 브라우저 기능 최초 출시일이나 모든 사내 브라우저의 지원일로 쓰지 않습니다.

Appium 권고는 열람 당시 CVE가 지정되어 있지 않았습니다. GHSA 식별자를 유지합니다. Netty 영향 버전 확인은 현재 설치 버전과 설정을 먼저 확인하는 별도 dependency 검토 사항입니다.

스킬은 계정·조직·객체별 접근 권한, 토큰 폐기, 배포 노출, 모든 XSS 경로까지 한 번에 검사하는 종합 스캐너가 아닙니다. 선택한 웹 출처의 읽기·요청 효과·소켓 진입을 재현하고 수정 후 같은 근거로 확인하는 데 집중합니다.
