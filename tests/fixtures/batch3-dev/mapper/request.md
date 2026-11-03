# 요청

이 Mapper와 XML, 결과 DTO를 점검해주세요. 메서드명·바인딩·결과 필드와 빈 목록을 확인하고, 수정이 필요하면 좁은 변경안을 주세요. SQL은 실행하지 마세요.

환경: MyBatis 3.5.16, Oracle 19c. XML 한 개가 해당 namespace로 등록되어 있고 다른 annotation/provider/inherited mapping은 없습니다. `mapUnderscoreToCamelCase=false`, 일반 bean 자동 매핑입니다. Mapper 인터페이스는 Java `-parameters` 없이 컴파일합니다. `useActualParamName=false`입니다. 합성 입력입니다.

업무 요구: 선택한 명세서 ID만 반환합니다. 선택한 ID가 없으면 결과도 없어야 합니다. 단건 조회는 명세서 ID로 조회합니다.
