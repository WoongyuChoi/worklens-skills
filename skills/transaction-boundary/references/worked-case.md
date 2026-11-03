# Worked case

The invented configuration is Spring 6.2, enabled class-based proxy transaction management, one JDBC transaction manager, default rollback rules, all shown classes as distinct managed beans, and successful JDBC writes. The controller calls the `OrderService` proxy. No execution was performed.

`OrderService.java`

```java
@Transactional
public void place() {
  orders.insert();
  this.localAudit();
  auditService.record();
  throw new IllegalStateException("실패");
}
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void localAudit() { localAuditRows.insert(); }
```

`AuditService.java`

```java
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void record() { auditRows.insert(); }
```

## Useful result

판정: 소스와 제공된 프록시 설정을 기준으로 외부 감사 기록만 독립 커밋할 수 있습니다. 같은 객체의 `localAudit` 호출에는 별도 프록시 경계가 없습니다.

| 호출 | 경계 | 예외 후 예상 결과 | 근거 |
|---|---|---|---|
| `place` | T1 시작 | 주문 INSERT 롤백 | `OrderService.java:1~3,6` |
| `this.localAudit` | T1 참여, 새 경계 없음 | 로컬 감사 INSERT도 롤백 | `OrderService.java:4,8~9`, proxy mode |
| `auditService.record` | T1 일시 중단, T2 독립 실행 | T2의 정상 커밋은 남음 | `OrderService.java:5`, `AuditService.java:1~2` |

확인 수준: 정적 확인. DB 반영을 실제로 관찰한 결과가 아닙니다.

## Catch variant

Consider a separate managed `InventoryService.reserve` with REQUIRED that inserts then throws `IllegalStateException`. `place` catches that exception after the call to the proxy and returns normally. Under the supplied standard manager rules, the joined scope can mark T1 rollback-only, so “catch 했으니 커밋” is not the right conclusion; an outer commit attempt can produce `UnexpectedRollbackException`.

Contrast that with a simple Java exception thrown and caught entirely inside `place` before crossing a transactional boundary: there may be no automatic rollback-only mark from that exception. Inspect resource errors or explicit marks before concluding that T1 can commit. Do not manufacture a real persistence outcome from either illustrative path.
