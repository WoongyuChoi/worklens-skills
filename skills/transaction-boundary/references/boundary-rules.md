# Boundary rules

## Establish interception

- Read the exact framework version and enabled advice. Annotation presence alone does not activate transactions; XML pointcuts or `TransactionTemplate` may instead define the operative boundary.
- In proxy mode, follow calls entering the proxy from another object. A same-instance `this.method()` call ordinarily bypasses that method's proxy advice even if it carries `REQUIRES_NEW`.
- Inspect actual proxy type and method visibility/finality. Interface proxies require appropriate public interface methods. Spring 6.x class proxies can include protected/package-visible methods depending on configuration; avoid the universal claim that every non-public method is ignored. Private/final interception limitations and custom `publicMethodsOnly` settings matter.
- Distinguish class/method/interface annotations, overriding methods and AspectJ weaving. Do not transfer proxy self-invocation conclusions to configured weaving without checking it.
- Resolve the transaction manager qualifier/default and resource participation. Two data sources or transaction managers are not automatically one atomic transaction. Inspect actual JTA/XA enlistment rather than inferring it from deployment on an application server.

## Represent the transaction

| Propagation | What to establish at an intercepted call |
|---|---|
| REQUIRED | Starts a transaction if absent or joins a compatible existing one; nested logical scopes may share one physical transaction. |
| REQUIRES_NEW | Suspends existing participation and starts independent work when the manager supports it; separate commit/rollback and extra resource demand can matter. |
| NESTED | Savepoint behavior inside one physical transaction only where the manager/resource supports it; it is not an independent committed transaction. |
| SUPPORTS / NOT_SUPPORTED | Existing participation versus a suspended/nontransactional path; inspect actual resource behavior outside a transaction. |
| MANDATORY / NEVER | Whether an existing transaction makes the invocation valid or invalid. |

For joined REQUIRED work, inner isolation/timeout/readOnly declarations do not automatically replace outer settings. Check validation flags and manager behavior. `readOnly=true` alone is not a universal write prohibition.

## Trace exceptions and state separately

1. Record exact thrown type and where it crosses an interceptor. A catch entirely inside the advised method may hide the exception from that advice.
2. Apply explicit `rollbackFor`, `noRollbackFor`, XML/programmatic/default rules and matching specificity. Traditional defaults roll back runtime exceptions/errors, but checked exceptions and global custom rules require actual configuration. Spring 6.2+ can change defaults using `rollbackOn`; do not assume an older default for every project.
3. Distinguish catching an exception before it crosses any transactional boundary from catching one after a joined inner boundary has marked the transaction rollback-only.
4. Under ordinary joined REQUIRED behavior, an outer method can return normally yet fail at commit with `UnexpectedRollbackException` after an inner rollback-only mark. Do not promise that catching “restores” the transaction.
5. Follow translated/wrapped exceptions and manual rollback-only flags. Resource errors may invalidate a transaction independently of a source-level catch; absence of a rethrow does not prove commit.

## Effects outside the boundary

- SQL execution, ORM flush and application logging are not the same as durable commit. Account for deferred constraint/flush failures when the supplied persistence stack uses them.
- An independently committed REQUIRES_NEW write can survive outer failure. A savepoint rollback cannot erase an earlier independent commit. Check whether the business requirement wants that behavior before calling it a defect.
- Thread-bound imperative transactions do not automatically carry into a new executor thread. Trace `@Async`, executors and callbacks through their actual advice/order and newly created boundaries. Reactive context uses different propagation; do not flatten it into a thread-local call trace.
- File writes, HTTP calls and non-enlisted messages do not roll back merely because a DB transaction does. An after-commit callback runs after the transaction outcome; its failure does not undo the committed data.
- A test-managed transaction can change the entry conditions and hide production commit behavior. Record whether the test starts a transaction outside the service, and whether it actually observes state after the relevant commit/rollback boundary.

## Reference basis

- [Spring transaction annotations](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html).
- [Spring propagation](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html).
- [Spring 6.2 rollback rules](https://docs.spring.io/spring-framework/reference/6.2/data-access/transaction/declarative/rolling-back.html).
- These are provenance links. The offline workflow requires only supplied sources/configuration; use the project's exact version and settings.
