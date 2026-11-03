# Worked case

This synthetic case demonstrates why matching syntax is insufficient. The user supplied the business rule: payment amounts compare by numerical value; invoice text preservation compares exact representation.

`before/PaymentCheck.java`

```java
boolean paid(BigDecimal charged, BigDecimal expected) {
  return charged.equals(expected);
}
```

`after/PaymentCheck.java`

```java
boolean paid(BigDecimal charged, BigDecimal expected) {
  return charged.compareTo(expected) == 0;
}
```

The user confirmed `charged=10.0`, `expected=10.00` was wrongly rejected. Both parameters are non-null under the supplied boundary contract.

`RefundCheck.java`

```java
boolean complete(BigDecimal refunded, BigDecimal requested) {
  return refunded.equals(requested);
}
```

`InvoiceSnapshot.java`

```java
boolean representationUnchanged(BigDecimal oldValue, BigDecimal newValue) {
  return oldValue.equals(newValue);
}
```

`LabelCheck.java`

```java
boolean sameLabel(String a, String b) {
  return a.equals(b);
}
```

## Useful result

판정: 숫자값만 비교해야 하는 환불 검사 1곳에서 같은 원인을 확인했습니다. 전표 표현 비교와 문자열 비교는 제외했습니다.

| 위치 | 분류 | 근거·반례 |
|---|---|---|
| `RefundCheck.java:2` | 정적 확인 · 동일 원인 | 금액 동등성 요구에 대해 `10.0`, `10.00`의 scale 차이가 결과를 바꿉니다. |
| `InvoiceSnapshot.java:2` | 정적 확인 · 정상 유사 코드 | 제공된 요구가 표현의 동일성까지 비교하므로 이 차이가 필요합니다. |
| `LabelCheck.java:2` | 정적 확인 · 무관 | 문자열 비교이며 확인된 금액 결함의 원인이 아닙니다. |

검색 근거: 먼저 변경 전의 정확한 호출을 확인하고, 지정 소스 범위에서 `.equals(` 후보를 읽었습니다. 실행 확인은 수행하지 않았습니다. 이 예시의 파일 밖에 같은 결함이 없다는 뜻은 아닙니다.

If the refund business rule is not supplied, report that candidate as conditional until intent is established. Do not introduce a new nullability bug when the stated input contract excludes null; separately inspect whether that contract is enforced only if the user's task or evidence calls it into question.
