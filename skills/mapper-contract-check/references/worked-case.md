# Worked case

This is an invented excerpt, not a database execution. Listed line numbers belong to these displayed files.

`OrderMapper.java`

```java
package demo;
interface OrderMapper {
  List<OrderRow> findByIds(@Param("ids") List<String> ids);
  OrderRow findOne(String orderId);
}
```

`OrderMapper.xml`

```xml
<mapper namespace="demo.OrderMapper">
  <select id="findByIds" resultType="demo.OrderRow">
    SELECT order_id AS orderId FROM orders
    <where>
      <if test="ids != null and ids.size() > 0">
        order_id IN
        <foreach collection="orderIds" item="id" open="(" separator="," close=")">#{id}</foreach>
      </if>
    </where>
  </select>
  <select id="findOne" parameterType="string" resultType="demo.OrderRow">
    SELECT order_id AS orderId FROM orders WHERE order_id = #{value}
  </select>
</mapper>
```

`OrderService.java`

```java
List<OrderRow> selected(List<String> selectedIds) {
  return mapper.findByIds(selectedIds);
}
```

The supplied business requirement says an empty selection must return no orders. `OrderRow` has a writable `String orderId`; the mapper is registered with ordinary string type handling.

## Useful result

| 입력·매핑 | 결과 | 근거 |
|---|---|---|
| `findByIds(["A"])` | 정적 확인 · 이름 불일치 | `OrderMapper.java:3`는 `ids`로 이름을 정했지만 XML 7행은 `orderIds`를 조회합니다. |
| `findByIds([])` | 정적 확인 · 조회 범위 확대 | XML 5행에서 조건 전체를 생략하고 서비스 2행은 빈 목록도 전달합니다. “선택 없음 → 결과 없음” 요구와 다릅니다. |
| `findOne("A")`의 `#{value}` | 정적 확인 · 이름 불일치로 보고하지 않음 | 단일 문자열의 타입 처리 경로입니다. Java 인자명과 placeholder 철자가 다르다는 이유만으로 오류가 아닙니다. |

수정 제안: 반복문의 collection을 실제 이름에 맞추고, 빈 선택의 반환 정책은 서비스 조기 반환 또는 XML의 명시적 빈 결과 분기로 한 곳에서 구현합니다. 실제 SQL 실행은 수행하지 않았습니다.

If the caller instead rejects empty lists, remove the second defect and document the guard. If the requirement allows unrestricted search, describe the behavior without calling it a bug. Avoid “fixing” the scalar placeholder merely for consistency.
