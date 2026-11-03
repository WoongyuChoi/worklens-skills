# Audit an assertion, not just a test name

## Trace the observation chain

Input/setup -> code branch -> behavior/side effect -> awaited completion -> observed value -> assertion -> failure signal.

A break in this chain can leave a test green. Check that a failure exits the runner as a failure; printing “failed” is not an assertion. In Java, do not rely on the optional `assert` keyword unless enabled by the actual runner. The bundled example uses `AssertionError` explicitly.

## Weakness examples

| Test shape | Why it can be weak | Better question |
|---|---|---|
| `assertNotNull(result)` | Incorrect rows or amounts can still be non-null | Which field/value/relationship is contractual? |
| Expected value from the same target helper | Shared defect validates itself | Is there a literal or independently derived oracle? |
| Mock returns the entire expected DTO | Mapping may never run | Does the target transform a lower-level mocked dependency? |
| Only `rows.size()` checked | Wrong identity/order/content can escape | Which identity/content/order matters for this behavior? |
| Async call without awaiting | Test can finish before assertion | Does the runner observe the Promise/future and failure? |
| Broad catch with no failure | Expected error path need not happen | Is the specific exception and condition asserted? |
| Exact implementation call sequence everywhere | Harmless refactors fail while outputs remain wrong | Which call is an actual side-effect contract? |

Mocks are not inherently weak. A unit test may correctly mock I/O and inspect its call arguments while asserting the real business transformation. State the boundary it covers; do not require an integration environment as a prerequisite for every test.

## Mutation classifications

- 검출: the original target passes, the mutation builds/runs, the intended assertion fails because of the relevant behavior, and restoration passes.
- 생존: the mutation builds/runs but the target test stays green. Investigate input reachability and equivalent behavior before calling the test defective.
- 동등 가능: for the stated domain the behavior may not differ; justify it and choose a better mutation.
- 무효: compilation, startup or unrelated fixture failure prevents the behavior from reaching the assertion.
- 미실행: static prediction only; never count as detection.

Pick a plausible behavior mutation, not an arbitrary exception thrown before setup. Example: if the test claims the start boundary is inclusive, change `>=` to `>` and use exactly the boundary. Testing a value far from the boundary will not distinguish them.

## Scope and recovery

One to three selected mutations are an explanatory probe, not a representative sample of all defects. Do not calculate a project mutation score from them. Use a dedicated copy or existing injected collaborator; keep a content hash/copy of every changed file, restore that exact version and rerun the original case. A clean Git reset is not acceptable when it would erase user changes; Git is not required.

When execution is blocked, a useful static report still shows the missing observation, a strengthened assertion and the input that reaches the intended branch. Call these recommendations, not executed results.
