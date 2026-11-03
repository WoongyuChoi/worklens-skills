# Worked case

This invented workflow has Spring Batch, chunk size 2, stable inputs `A/B/C/D`, job `dailyTotal`, identifying `businessDate=2026-10-31`, non-identifying `attempt=1`. The supplied configuration explicitly puts the business table and JobRepository checkpoint in the same transaction. The reader persists its next position. The file append is outside that transaction.

`writer.txt`

```text
For each item in a chunk:
  set DB total for (businessDate, itemId) to the supplied deterministic total
  append the itemId to export.log
After writer returns, persist reader state and commit the DB transaction.
```

`capture.txt`

```text
Chunk A/B committed; persisted next position is C.
Chunk C/D performed DB writes and appended C/D to export.log.
Failure occurred before that chunk's DB commit; transaction rolled back.
The persisted next position is C; export.log contains A,B,C,D.
```

## Useful result

판정: 같은 작업 인스턴스로 재시작하면 DB는 C/D부터 다시 반영하지만, 파일에는 C/D가 다시 추가될 수 있습니다. 새 `run.id`를 식별 파라미터로 넣으면 같은 재시작이 아니라 새 인스턴스가 됩니다.

| 다음 시도 | 읽는 항목 | DB 결과 | 파일 결과 | 확인 수준 |
|---|---|---|---|---|
| 동일 이름·동일 식별 파라미터, attempt만 2 | C,D | 결정적 값 설정을 다시 수행 | A,B,C,D,C,D | 정적 확인 · 합성 재처리표 |
| 새 식별 파라미터 run.id 추가, 처음부터 읽는 새 인스턴스 | A,B,C,D | 같은 업무 키의 결정적 값 설정 | A,B,C,D,A,B,C,D | 정적 확인 · 합성 재처리표 |

근거: `writer.txt:2~4`, `capture.txt:1~4`에 DB/파일 반영과 체크포인트 관계가 주어졌습니다. 실행 확인은 하지 않았습니다.

Do not invent a C/D database-committed/checkpoint-old state here: the supplied configuration commits both atomically. If the writer were `total = total + amount`, a new-instance rerun would have a different business effect even though the same row key is reused. If job parameters or reader initialization are unavailable, keep the new-instance row conditional.

최소 조치 후보: 내보내기 파일을 업무 키에 따라 재생성하는 방식 또는 실제로 지원되는 중복 방지 방식을 검토합니다. 파일 전략 변경 없이 `run.id`만 바꾸는 처방은 이 중복 경로를 해결하지 않습니다.
