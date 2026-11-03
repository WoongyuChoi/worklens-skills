# Worked case

This invented plan excerpt is for reasoning practice. It is not an Oracle execution performed by this skill. Its supplied capture metadata states Oracle 19c, completed fetch, one serial execution, actual per-operation statistics. `orders.customer_code` is VARCHAR2 with an ordinary single-column index; the bind is NUMBER. Region has four rows.

`query.sql`

```sql
SELECT o.order_id
FROM orders o JOIN region r ON r.region_id = o.region_id
WHERE o.customer_code = :customer_code AND r.enabled = 'Y'
```

`plan.txt`

```text
Id | Operation         | Name   | Starts | E-Rows | A-Rows | Buffers
 0 | SELECT STATEMENT  |        |      1 |        |   1000 |    8001
 1 | HASH JOIN         |        |      1 |      5 |   1000 |    8001
 2 |  TABLE ACCESS FULL| REGION |      1 |      4 |      4 |       1
 3 |  TABLE ACCESS FULL| ORDERS |      1 |      5 |   1000 |    8000
Predicate 2: filter(R.ENABLED='Y')
Predicate 3: filter(TO_NUMBER(O.CUSTOMER_CODE)=:CUSTOMER_CODE)
```

## Useful result

판정: `ORDERS`의 문자 컬럼에 숫자 바인드를 비교하는 부분을 먼저 확인할 만합니다. 제공된 계획만으로 인덱스를 쓰면 빨라진다고 확정하지는 못합니다.

| 우선 | 관찰 | 가설·다음 확인 |
|---|---|---|
| 1 | `query.sql:3`, `plan.txt:7`: 컬럼 쪽 `TO_NUMBER`; 3번 연산은 8,000 buffers | 실제 업무 키가 문자열이라면 바인드를 해당 타입에 맞춘 동일 결과 비교가 필요합니다. 변경 후 계획·buffers·전체 fetch 시간을 비교합니다. |
| 2 | `plan.txt:5`: Starts=1, E-Rows=5, A-Rows=1,000 | 200배 차이가 있지만 오래된 통계로 확정할 수 없습니다. 이 바인드의 값 분포와 기존 통계·다른 child cursor 근거를 확인합니다. |

제외한 주장: REGION의 FULL SCAN은 4행·1 buffer이므로 이름만 보고 병목으로 보고하지 않습니다. 부모와 자식의 buffers를 합쳐 총 24,003이라고 계산하지 않습니다.

확인 수준: 제공된 실행 자료를 정적으로 판독했습니다. 새 실행이나 성능 향상 검증은 하지 않았습니다. 숫자로 보이지 않는 키가 존재하는지는 자료에 없어 변환 오류 가능성도 조건부입니다.

If this were only `EXPLAIN PLAN` without Starts/A-Rows/Buffers, remove all actual-work conclusions and treat the conversion as a static hypothesis. If the bound type or index definition were absent, mark those premises as unknown.
