# Worked case

This synthetic example supplies Oracle 19c, ordinary permanent tables and a rolling application release. There is no execution or full-table data export.

`before.sql`

```sql
CREATE TABLE customer (
  id VARCHAR2(20 BYTE) PRIMARY KEY,
  legacy_code VARCHAR2(30 BYTE)
);
```

`change.sql`

```sql
UPDATE customer SET legacy_code = SUBSTR(legacy_code, 1, 12);
ALTER TABLE customer RENAME COLUMN legacy_code TO customer_code;
ALTER TABLE customer MODIFY customer_code VARCHAR2(12 BYTE) NOT NULL;
```

`OldMapper.xml`

```xml
<select id="find" resultType="map">
  SELECT id, legacy_code FROM customer WHERE id = #{id}
</select>
```

## Useful result

판정: 현재 순서로는 구버전 조회가 깨지고 원래 코드 값 일부를 잃을 수 있습니다. DDL이 실패한 뒤 `ROLLBACK`만으로 처음 상태로 되돌릴 수 있다고 볼 수 없습니다.

| 항목 | 판정 | 근거·영향 |
|---|---|---|
| 구버전 조회 | 정적 확인 | `OldMapper.xml:2`는 `legacy_code`를 읽으므로 `change.sql:2` 이후 공존할 수 없습니다. |
| 값 축약 | 정적 확인 · 조건부 손실 | `change.sql:1`이 12문자보다 긴 값을 잘라냅니다. 실제 해당 행 수는 확인 못 함입니다. |
| BYTE 폭과 null | 확인 못 함 | 12문자가 반드시 12 BYTE 이하는 아닙니다. 기존 null이나 다중 바이트 값에 따라 3행이 실패할 수 있습니다. |
| DML 복구 | 정적 확인 | 2행의 일반 Oracle DDL 전 커밋 경계가 있으므로 앞선 UPDATE를 단순 ROLLBACK으로 복구한다고 계획하면 안 됩니다. |

순서 제안: 기존 값을 보존하는 새 컬럼 추가 → 구신 코드의 읽기/쓰기 전환 규칙 적용 → 무손실 변환 여부와 null/byte 길이 검증 → 구버전 종료 → 이름·제약 정리. 축약 자체가 업무적으로 허용되는지 먼저 확정해야 합니다.

미실행 검토안:

```sql
SELECT COUNT(*) AS invalid_count
FROM customer
WHERE legacy_code IS NULL OR LENGTHB(legacy_code) > 12;
```

This query assesses values against the proposed byte/null limit; it does not authorize truncation, prove a safe rollout, or restore original values. A recovery plan needs preserved originals keyed by `id` and reconciliation for later writes, not just reverse DDL.
