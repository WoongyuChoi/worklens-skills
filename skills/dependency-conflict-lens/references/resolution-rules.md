# Resolution rules

## Fix the observation scope

- Keep module path, configuration, Gradle version, report time and command together. A root project's `dependencies` output may not describe an application's runtimeClasspath; testRuntimeClasspath can differ again.
- Distinguish buildscript/plugin classpath from application dependencies. Do not use a plugin's library version to explain application runtime without a real connection.
- Read the report legend and preserve markers. In Gradle reports, arrows show selection changes, `(c)` marks a constraint, `(*)` can mark a repeated subtree, and unresolved/non-resolvable markers are not a successfully selected runtime artifact. A repeated branch is not a duplicate loaded JAR.

## Identify requests, selection and ownership

| Evidence | Interpretation boundary |
|---|---|
| Version catalog alias | Provides a requested coordinate/version; it does not automatically force every transitive occurrence to that version. |
| `platform` / BOM | Participating version constraints; inspect the resolved report and other constraints rather than assuming unconditional force. |
| `enforcedPlatform` / `resolutionStrategy.force` | Can enforce selection; locate the actual platform/rule and its applicable scope. |
| `strictly`, `prefer`, `reject` | Different rich-version requirements; retain the precise rule and check conflicts rather than paraphrasing all as a fixed version. |
| `constraints` | Influences selection when the module participates; not necessarily a direct dependency adding the artifact by itself. |
| Substitution / composite build / resolution rule | The selected component may differ in coordinate or become a project dependency. Follow the rule, not just version text. |
| Lock state | May constrain this resolution; do not delete or rewrite locks as a diagnostic shortcut. |

Trace convention plugins, applied scripts and dependency management plugins only as needed to find the owner. If a rule lives in an unavailable init script or external plugin, report that owner as unresolved rather than blaming the nearest visible declaration.

`dependencyInsight` can list several selection reasons. Keep those that explain the actual result and use the reverse paths to connect them to direct dependencies/platforms. If a report was captured with a single-path option, do not claim it enumerates all routes.

## Error and runtime boundary

- `NoSuchMethodError` is consistent with a binary linkage mismatch but does not by itself identify the offending version. Keep method name, parameter and return descriptors; similarly named overloads are not interchangeable.
- Compare expected class/method evidence with the artifact containing the runtime class. Shading, duplicate classes, generated code and server classloader policy can invalidate a naive coordinate-to-class assumption.
- For WAR/JEUS or another container, inspect supplied packaging lists, shared/provided libraries and actual class-origin logs. The Gradle runtimeClasspath does not automatically describe the server's effective classloader.
- A JAR filename or dependency tree does not establish actual loaded origin. Existing `jar`/`javap` tools or classloading logs may provide evidence when available; they are optional and must not be fabricated.
- A successful compile proves compatibility only for the compile classpath used. It does not verify deployment packaging, initialization or the code path that throws the runtime error.

## Optional offline collection

Prefer reports already supplied. If the distribution and dependencies/plugins are cached and build logic is trusted/reviewed, narrowly scoped examples are:

```sh
./gradlew --offline --console=plain :app:dependencyInsight --dependency example:codec --configuration runtimeClasspath
./gradlew --offline --console=plain :app:dependencies --configuration runtimeClasspath
```

Replace example project/coordinate with verified values. A Gradle offline flag constrains dependency resolution; it does not sandbox arbitrary build logic or stop the wrapper from downloading a missing distribution. Do not run a wrapper if its distribution is unavailable, use `--scan`, request remote repositories, clear caches or add `--refresh-dependencies`. Missing cached artifacts are 확인 못 함, not proof that the declaration is wrong.

## Choose a scoped correction

Prefer changing the controlling platform/constraint/rule consistently with related modules. If proposing an exclusion, check the excluding edge, remaining providers and whether callers still require the excluded API. Avoid suppressing a symptom by forcing one library in isolation when its family must be aligned. Validate the affected runtime/test configuration and relevant behavior with the already available offline setup; do not promise deployment success from a changed report alone.

## Reference basis

- [Gradle dependency reports](https://docs.gradle.org/current/userguide/viewing_debugging_dependencies.html).
- [Gradle dependency caching](https://docs.gradle.org/current/userguide/dependency_caching.html).
- Links establish provenance only. The offline review reads local artifacts and respects the deployed Gradle version.
