# Binding rules

## Registration and statement identity

- Match `package.Interface.method` to the selected namespace/id and registered resource. Trace aliases and mapper scanning only far enough to prove that mapping is active. A similarly named XML in an unused module is not the implementation.
- Consider annotation/provider statements, inherited interfaces and `databaseId` selection before reporting a missing or duplicated id. XML ids are not overloaded by Java argument types; distinguish actual duplicate mappings from inactive database variants.
- Resolve local `<include refid>` and its configured properties. Preserve a branch as unresolved if fragments/provider code are not supplied; do not invent expanded SQL.

## Build the parameter root first

| Shape | Check before flagging a placeholder |
|---|---|
| Explicit `@Param("filter")` | The named root and its nested property path, such as `filter.customerId`. |
| Single DTO without `@Param` | Direct bean properties may be valid; a redundant DTO root is not automatically available. |
| Single simple value with a type handler | A placeholder name does not necessarily need to match the Java parameter name. Verify the scalar binding path; avoid a blanket `@Param` requirement. |
| Multiple arguments | Named/generic parameter map, MyBatis version, `useActualParamName`, compiler `-parameters`, and special arguments such as `RowBounds`. |
| Map | Keys supplied by the caller, missing/null behavior, and any explicit named wrapper. |
| Collection/array | Version-dependent wrapping plus explicit names; `list`, `collection`, `array` and actual names are not interchangeable in every configuration. |

Track `foreach` item/index as local variables, and `<bind>` values as newly defined names. `parameterType` is not a substitute for the runtime parameter root. With uncertain actual-name metadata, give a conditional finding and one decisive check instead of guessing.

## Dynamic SQL and substitution

- For relevant branches, reconstruct only enough SQL to evaluate the contract: predicates present/absent, parentheses, commas, JOIN filters and placeholders. Inspect `<where>`, `<trim>`, `<set>`, `<choose>` and local includes together.
- Test null and empty collections separately. A `<foreach>` producing no elements, a guard omitting the entire `IN` condition, and an explicit `1=0` fallback have different semantics. `nullable` handling does not supply the business rule for an empty list.
- Trace caller behavior before claiming an empty-list issue is reachable. Early returns or validation can remove the path. An administrative search allowing no filter is not equivalent to a method promising “only these ids.”
- `#{...}` binds values; `${...}` substitutes SQL text. For substitution, follow provenance. A closed mapping from a trusted enum to a fixed column name differs from direct user text. Do not call every substitution exploitable; do not assume interpolation is safe from its variable name.
- Check nullable parameter JDBC types/type handlers only when relevant to the database/driver and supplied settings. A missing `jdbcType` is not a universal defect.

## Result contract

- Resolve `resultType` versus `resultMap`, their aliases and nested maps; inspect selected column labels, not only physical column names. Account for `mapUnderscoreToCamelCase`, auto-mapping behavior, explicit aliases and case normalization.
- Match property/constructor access to the actual object definition. Records, immutable classes, constructors, inherited setters and custom object factories may need different evidence. Do not assume “missing setter” always means failure.
- For nested result collections, inspect `<id>`, parent/child keys, `columnPrefix`, null child columns and mapping structure. Repeated SQL rows may correctly assemble one parent. Two independent one-to-many joins can still multiply aggregate sums before mapping; tie that risk to actual aggregation or caller behavior.
- Check generated key property paths, `selectKey` order and an affected-row-count return only when those are part of the failing contract.
- Do not infer schema uniqueness, index presence or query result counts from DTO names. Without schema/data evidence, say which condition would make the risk real.

## Optional local verification

An existing MyBatis configuration/statement-load test can detect registration errors without a live database; do not invent one that silently requires a connection. Existing SQL integration tests can establish binding/result behavior when already available. Report each separately from manual branch tracing. A parser or XML well-formedness check alone cannot establish mapper correctness.

## Reference basis

- [MyBatis Java API](https://mybatis.org/mybatis-3/java-api.html) and [Mapper XML](https://mybatis.org/mybatis-3/sqlmap-xml.html) describe the mapping mechanisms. These are provenance links, not required network dependencies. Apply the locally configured version.
