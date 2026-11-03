# 요청

`web` 모듈을 WAR로 배포하면 첨부한 `NoSuchMethodError`가 납니다. build.gradle의 직접 버전을 고쳤는데도 runtime 리포트는 다릅니다. 어떤 버전이 왜 선택됐고 어디를 바꿔야 하는지, 오류 원인까지 확정할 수 있는지 확인해주세요.

합성 좌표와 리포트입니다. Gradle 8.10이며 제공된 리포트는 현재 소스의 web:runtimeClasspath입니다. 서버는 JEUS이며 실제 class origin 로그나 서버 공용 라이브러리 목록은 아직 없습니다. artifact JAR 또는 메서드 API 목록도 제공하지 않습니다. 명령 실행이나 다운로드는 하지 마세요.
