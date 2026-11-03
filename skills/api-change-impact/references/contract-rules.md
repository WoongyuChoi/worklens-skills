# Contract rules

## Establish the wire contract

- Combine class and method request mappings; retain HTTP verb, consumes/produces conditions, path variables, query parameters, headers and context-path configuration. A path match with a different verb is not the same operation.
- Distinguish `@RequestParam(required=...)`, a default value, an optional wrapper, `@RequestBody` presence and constraints on fields within the body. A required body does not make every property required.
- For responses, follow `ResponseEntity`, wrappers, pagination, exception advice and branch-specific status/body changes. A change from an object to an empty 204 body can break a client still parsing JSON.
- Read the actual Jackson version, configured naming strategy, mix-ins, visibility, getters/records, custom serializer/deserializer and relevant modules. A private field rename may leave the JSON unchanged; an accessor or `@JsonProperty` can determine the emitted name.
- Check `@JsonIgnore`, inclusion rules, access modes and views in the applicable direction. `@JsonAlias` is a deserialization alias; it does not generally preserve the old serialized response name. Do not treat a request-only property as a response regression.

## Requiredness and nullability

Keep separate columns for presence, explicit null and value validation. Use these questions in order:

1. Can the HTTP binding layer reject the whole parameter/body before deserialization?
2. Does the actual creator/field/setter path reject a missing property? Inspect Jackson settings, creator annotations and custom logic. A record component or primitive type alone does not prove mandatory JSON presence.
3. What happens to explicit null? Primitive defaulting/failure settings, creator-null settings, custom deserializers and constructors can differ from missing-value behavior.
4. Is Bean Validation actually invoked at this boundary, with the applicable group and nested `@Valid` traversal? A constraint sitting on an unused DTO or an inactive group is not evidence of request rejection.
5. Does later service logic enforce a requirement independently? Cite that check rather than attributing it to Jackson.

Do not equate `@JsonProperty(required=true)` on every mutable field with a universal runtime non-null check. Its interpretation depends on creator binding and version/configuration; presence and non-null are different requirements. When configuration is absent, report a conditional risk instead of selecting a convenient default silently.

## Match consumers to operations

- Resolve client base paths and route constants, then HTTP method. Inspect a shared transport's query/body transformation, response envelope removal, error normalization and runtime schema validation.
- Trace data flow from request payload construction or response extraction to the screen/caller. Destructuring, renamed imports and adapters may preserve compatibility. Do not assume `axios<T>` or a TypeScript interface validates a server payload at runtime.
- Separate Java/JSON numeric representation from TypeScript `number`. Preserve identifier strings and flag loss of exactness only where the changed wire type and arithmetic/parsing path establish it.
- Evaluate enum additions against exhaustive switches, fallback branches and runtime validators. A new value is not universally safe or universally breaking.
- For nullability expansion, identify the actual unguarded operation (`trim`, nested property, iteration). For stricter request validation, identify a real sending branch that omits or sends the rejected value.
- For changes that remain compatible, give one short explanation: wire name retained, active adapter, unused response property in the inspected clients, or a fallback covers the new case. Do not fill the report with hypothetical changes unrelated to the diff.

## Confidence and evidence

| Label | Use |
|---|---|
| 정적 확인 · 계약 불일치 | Both linked sides and a contradictory behavior are visible in sources. |
| 정적 확인 · 조건부 영향 | The failure follows only under a stated unresolved configuration or data condition. |
| 실행 확인 | A specific locally executed test exercised the actual relevant implementation; name fixture and command. |
| 확인 못 함 | Missing baseline, generated source, unavailable module/configuration, dynamic route or external consumer prevents a claim. |

Attach a path and line to every source claim. A search hit list is a navigation aid, not proof of all impact. Keep the final recommendation within the changed contract: server compatibility window, consumer adaptation, or one targeted test.

## Reference basis

- Jackson annotation semantics: [JsonProperty Javadoc](https://www.javadoc.io/static/com.fasterxml.jackson.core/jackson-annotations/2.21/com/fasterxml/jackson/annotation/JsonProperty.html).
- Missing/null creator settings: [DeserializationFeature Javadoc](https://www.javadoc.io/static/com.fasterxml.jackson.core/jackson-databind/2.18.5/com/fasterxml/jackson/databind/DeserializationFeature.html).
- These links document reasoning provenance; opening them is not required to use this offline skill. Apply the project's version, not the linked version by assumption.
