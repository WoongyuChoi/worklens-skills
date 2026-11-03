# 요청

`before`에서 `after`로 DTO를 바꾸려고 합니다. 프런트의 조회와 저장에 미치는 영향을 확인해주세요. 입력에 없는 API나 화면은 추정하지 말아주세요.

환경: Spring MVC 6.2, Jackson 2.18.5, Bean Validation 활성화. 서버 context path는 `/intra`입니다. 별도 Jackson mix-in, naming strategy, custom serializer/deserializer는 없습니다. 누락 creator property 실패 설정과 primitive null 실패 설정은 비활성화입니다. Java public field 기본 바인딩을 사용합니다. 이 디렉터리는 합성 자료이며 실행 서버나 테스트 런타임은 없습니다.
