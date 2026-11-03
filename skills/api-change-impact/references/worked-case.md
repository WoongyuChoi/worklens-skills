# Worked case

Use this invented case to calibrate conclusions; do not present it as evidence from the user's project. Line numbers refer only to the displayed excerpts, counting all lines within each block.

## Supplied excerpts

`before/CustomerResponse.java`

```java
public record CustomerResponse(String displayName, String phone) {}
```

`after/CustomerResponse.java`

```java
public record CustomerResponse(@JsonProperty("displayName") String name, String phone) {}
```

`after/CustomerController.java`

```java
@GetMapping("/customers/{id}")
CustomerResponse get(@PathVariable String id) { return service.get(id); }
@PostMapping("/customers")
void save(@Valid @RequestBody SaveRequest request) { service.save(request); }
```

`after/SaveRequest.java`

```java
public record SaveRequest(@NotNull String contact, int priority) {}
```

Before, `contact` was an unconstrained String. Bean Validation is configured. The client returns the parsed response object without renaming properties.

`CustomerView.tsx`

```typescript
const customer = await client.get('/customers/' + id);
const label = customer.displayName.trim();
await client.post('/customers', { priority: 0 });
```

## Useful result

판정: 저장 요청 1곳은 새 검증 조건과 맞지 않습니다. 응답의 Java 이름 변경은 `@JsonProperty`가 기존 JSON 이름을 유지하므로 이 화면의 `displayName` 접근에 영향이 없습니다.

| 항목 | 판정 | 근거와 조건 |
|---|---|---|
| `POST /customers`, `contact` 누락 | 정적 확인 · 계약 불일치 | `CustomerView.tsx:3`은 값을 보내지 않고 `CustomerController.java:4`는 검증을 호출하며 `SaveRequest.java:1`이 null을 거부합니다. |
| Java `displayName` → `name` | 정적 확인 · 기존 이름 유지 | `after/CustomerResponse.java:1`의 JSON 이름은 그대로입니다. |
| `int priority`를 반드시 전송해야 하는지 | 확인 못 함 | Java 타입만으로 누락 거부를 단정할 수 없습니다. 실제 Jackson 설정과 생성자 처리를 더 확인합니다. |

실행 확인: 수행하지 않음. 제안 검증은 `contact` 누락, null, 정상 문자열을 각 1회 보내는 기존 Controller 테스트입니다. 서버에 직접 요청한 결과가 아닙니다.

Do not add a response-null bug unless the actual change or service evidence allows null. Do not claim `@NotNull` rejects an empty string; that is a different constraint. If the supplied controller lacked active validation, downgrade the first conclusion until another enforcing boundary is found.
