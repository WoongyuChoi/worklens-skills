# 요청

`CheckoutService.place`에서 재고 예외를 잡았으니 주문이 저장된다는 설명을 들었습니다. 아래 설정과 호출을 보고, 호출이 끝날 때 어떤 반영이 남는지 정리해주세요. DB 연결과 실제 실행은 하지 마세요.

환경: Spring 6.2, imperative JDBC, `@EnableTransactionManagement(proxyTargetClass=true)`, 하나의 `DataSourceTransactionManager`, 기본 전파/롤백 설정과 기본 참여 실패 처리입니다. 세 서비스는 별도 managed bean입니다. 컨트롤러는 CheckoutService 프록시의 public place를 호출합니다. 모든 RowStore는 같은 관리 DataSource를 사용하며 SQL 자체는 성공합니다. 다른 advice·JTA·수동 커밋은 없습니다. 합성 소스입니다.
