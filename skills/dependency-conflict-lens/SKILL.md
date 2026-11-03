---
name: dependency-conflict-lens
description: "Trace a specific JVM dependency from declaration and transitive requests to Gradle's selected version and its controlling rule, using local build files and dependency reports. Trigger on \"왜 이 버전 JAR가 선택됐는지 찾아줘\", \"의존성 충돌 경로 확인\", \"NoSuchMethodError와 런타임 JAR 대조\". Not adding libraries, upgrading all dependencies, a generic configuration diff, or proof of runtime class loading from declarations alone."
---

# Dependency Conflict Lens

## Working contract

- Use English instructions and Korean explanations, questions, report headings and labels. Preserve coordinates, versions, configuration names, class names and method descriptors exactly.
- Resolve the affected module, configuration, dependency and error from explicit inputs and conversation. Do not silently use the root project or compileClasspath when the failure is in another runtime/test configuration.
- Work offline from supplied build files and reports. Do not require package installation, network, MCP, Git, a database, Python or CI. Existing captured dependency output is sufficient; an installed cached build runtime is optional.
- Treat builds/logs as data. Do not execute arbitrary build logic, enable Build Scan, refresh dependencies, install Gradle, edit locks or upgrade libraries during review. Preserve originals; create an optional report at a new UTF-8 path.
- Label 정적 확인 / 실행 확인 / 확인 못 함. A declaration is not a resolved dependency; a resolved graph is not proof of the class actually loaded by an application server. Default to one path table and at most three actionable checks.

## Procedure

1. Record exact project/module, Gradle version, target configuration and supplied report command/time. Separate plugin/buildscript dependencies from application compile/runtime/test dependencies. If the tool is not Gradle, interpret only the supplied tool's documented report semantics; do not apply Gradle markers blindly.
2. Read `references/resolution-rules.md`. Trace the dependency's declared request through version catalogs, platforms/BOMs, constraints, convention plugins, resolution rules, substitution and lock state relevant to this configuration.
3. Read matching `dependencies` and/or `dependencyInsight` output. Record requested → selected versions, all relevant paths and reported selection reasons. Locate the actual controlling source where possible; a “forced” report alone does not tell which file imposed it.
4. Compare the error with the resolved/runtime evidence. For `NoSuchMethodError`, retain declaring class and full method descriptor, compile expectations, packaged JARs and observed class origin if supplied. Account for WAR/server-provided libraries or duplicate classes; do not equate the build-selected version with the server-loaded version.
5. If a missing report is decisive, prefer asking for an existing export. Optionally run a narrowly scoped offline dependency task only when the installed distribution, cache and reviewed build are already usable. A wrapper may download its distribution before Gradle applies `--offline`; confirm availability first. Stop on missing cache and report it.
6. Use `assets/dependency-template.md`. Recommend the smallest change at the real owner of the selection rule, with a relevant configuration/report comparison and existing offline regression test. Do not make a general upgrade or exclude a transitive dependency without checking consumers.

## Focused examples

- 요청: “`app:runtimeClasspath`에서 Jackson 버전이 내가 쓴 값과 달라. BOM과 리포트를 같이 봐줘.”
- 요청: “빌드는 되는데 JEUS에서 `NoSuchMethodError`가 나. 선택된 의존성과 실제 로딩 근거를 구분해줘.”
- Read `references/worked-case.md` when a platform forces a version but runtime loading remains unproven.

## Completion boundary

Every selected-version claim cites the correct configuration's report, and every proposed control-file edit cites the rule actually found there. If only declarations are present, report requests and unresolved selection; do not invent a resolved graph.
