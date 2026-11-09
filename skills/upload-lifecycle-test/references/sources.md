# 업로드 수명주기 검사 참고 자료

확인 기준일: **2026-11-09**. 아래 자료의 문제 유형을 참고하여 절차를 독립 작성했습니다. 타사 코드·패치·검사 도구를 패키지에 복사하지 않았으며, 스킬 실행 시 이 URL에 접속할 필요는 없습니다. 권고에 나온 제품을 사내에서 사용한다는 가정도 없습니다.

| 자료 | 날짜의 의미 | 검사에 반영한 관점 |
| --- | --- | --- |
| [Appium: Windows drive-relative symlink target bypass](https://github.com/appium/appium/security/advisories/GHSA-jx6v-jmqp-x365) | 2026-10-27 공개 | Windows 경로의 문자열 해석과 실제 링크 생성·쓰기 해석이 다를 수 있습니다. 존재하지 않는 경로의 fallback과 최종 쓰기 동작까지 확인합니다. Windows와 링크 권한 등 실제 조건을 구분합니다. |
| [Appium: Symlink chain based Zip Slip](https://github.com/appium/appium/security/advisories/GHSA-hm39-rvcc-qph6) | 2026-10-27 공개 | 기존 링크와 아직 없는 경로가 결합된 해석 차이를 고려합니다. 단순 정규화나 검사 함수 이름만으로 추출 경계가 보장된다고 판단하지 않습니다. |
| [CodeIgniter 공식 보안 권고 목록](https://github.com/codeigniter4/CodeIgniter4/security/advisories) 및 [공식 변경기록](https://github.com/codeigniter4/CodeIgniter4/blob/develop/CHANGELOG.md) | 다중 업로드 GHSA-cwxp-v62r-xwx2: 2026-10-09 공개 | optional 다중 업로드의 빈 항목이 뒤의 실제 파일 검사를 생략시키는 사례를 반영했습니다. 빈 항목 처리와 모든 실제 항목 검사를 분리합니다. 개별 권고 페이지 열람 실패로 상세 동작은 공식 변경기록에서 확인했습니다. |
| [CodeIgniter: trailing dots and embedded PHP extensions](https://github.com/codeigniter4/CodeIgniter4/security/advisories/GHSA-4hwf-v4mp-hf6c) | 2026-10-09 공개 | 파일 검증, 원본 이름 보존, 공개 저장 위치와 서버 실행 설정이 결합되는 조건을 확인합니다. PHP 전용 조건을 다른 프레임워크의 취약점으로 옮겨 적지 않습니다. |
| [Appium: storage deletion path](https://github.com/appium/appium/security/advisories/GHSA-jwgx-mp9m-jwcr) | 2026-06-30 공개 | 저장 때의 경로 정제가 삭제 때도 동일하게 적용되는지, lifecycle의 각 단계에서 계약이 유지되는지 살펴봅니다. 실제 파일 삭제를 무차별 시험하지 않습니다. |

10월 Appium 두 권고는 열람 당시 CVE가 지정되어 있지 않았습니다. GHSA 식별자를 사용하고 CVE 번호를 만들지 않습니다. vendor의 영향 범위와 수정 버전 판정이 필요하면 현재 설치 정보를 근거로 별도 dependency 검토를 수행합니다.

합성 fixture는 이 자료의 exploit을 복제하는 목적이 아닙니다. 작은 첨부파일 흐름에서 검사·공개 규칙을 실제 소스 수정과 재시험으로 검증하기 위한 원자료입니다. 외부 보안 도구나 npm 패키지의 설치를 요구하지 않습니다.
