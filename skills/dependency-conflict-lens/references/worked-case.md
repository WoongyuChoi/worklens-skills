# Worked case

The coordinates and reports below are invented. They demonstrate how to explain version selection without pretending to know the deployed classloader.

`app/build.gradle`

```groovy
dependencies {
  implementation enforcedPlatform(project(':company-platform'))
  implementation 'example:codec:2.4'
  implementation 'example:report-client:3.0'
}
```

`company-platform/build.gradle`

```groovy
plugins { id 'java-platform' }
dependencies {
  constraints { api 'example:codec:2.1' }
}
```

`runtime-insight.txt`

```text
Command: :app:dependencyInsight --dependency example:codec --configuration runtimeClasspath
example:codec:2.1
Selection reasons: Forced; By constraint
example:codec:2.4 -> 2.1
  app runtimeClasspath
example:codec:2.3 -> 2.1
  example:report-client:3.0 -> app runtimeClasspath
example:codec:2.1
  project :company-platform -> app runtimeClasspath
```

`error.txt`

```text
java.lang.NoSuchMethodError: 'byte[] example.Codec.encode(java.lang.String, boolean)'
Deployment: WAR on application server. Loaded class origin was not captured.
```

## Useful result

판정: 제공된 `app:runtimeClasspath` 자료에서는 회사 플랫폼의 제약이 `codec:2.1` 선택을 강제합니다. `2.4` 선언을 다시 써도 현재 제어 지점은 그대로입니다. 다만 서버가 실제로 `2.1`을 로딩했는지는 확인하지 못했습니다.

| 요청 → 선택 | 경로·선택 이유 | 제어 지점 | 확인 수준 |
|---|---|---|---|
| 2.4 → 2.1 | app 직접 요청; Forced/By constraint | `app/build.gradle:2`, `company-platform/build.gradle:3`, `runtime-insight.txt:2~5,8~9` | 정적 확인 |
| 2.3 → 2.1 | report-client 전이 요청 | `runtime-insight.txt:6~7`와 같은 플랫폼 제약 | 정적 확인 |
| 실제 서버 로딩 버전 | 자료 없음 | `error.txt:2` | 확인 못 함 |

다음 확인: 해당 메서드 서명이 기대되는 컴파일 자료와 WAR/서버의 실제 클래스 원본을 대조합니다. 변경이 필요하면 플랫폼 제약의 호환 범위를 검토하고 관련 런타임 리포트와 호출 테스트를 확인합니다.

Do not declare that codec 2.4 definitely contains that method; no artifact/API evidence was supplied. Do not conclude that changing the platform solves the server failure before the loaded origin and relevant API compatibility are established.
