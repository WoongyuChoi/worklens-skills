# Thread dump interpretation

## Supported evidence

The tool recognizes traditional quoted HotSpot thread headers containing tid, nid or a Java #id; java.lang.Thread.State lines; stack frames; explicit `- locked <0x...>` monitors; `waiting to lock`, `waiting to re-lock in wait()`, `waiting on` and `parking to wait for` markers. Snapshot names must differ. One input must contain one snapshot; repeated IDs are rejected. Limits: five snapshots, each 2 MiB characters / 40000 lines / 2000 threads, at most 150 frames per thread. Longer stacks are flagged and excluded from the identical-stack summary; raw lines remain available.

Only intrinsic-monitor acquisition waits create owner edges. Object.wait releases the waited-on monitor, including when a surrounding stack frame prints a lock marker. An AQS parking address is not automatically an owned monitor. Missing or multiple owners remain unresolved. A JVM deadlock-summary section is excluded from thread parsing and retained as a separate signal.

The parser does not support virtual-thread JSON, all vendor formats, ownable synchronizer ownership, native lock dependencies, missing/truncated headers or complete virtual-thread scheduling analysis. Manually reading additional evidence can extend the report, but do not present that as the tool's coverage.

## Evidence ladder

1. **Observed:** exact state, stack and monitor IDs at a named source line.
2. **Repeated observation:** same identity/name/state/frames in all supplied snapshots. Check that snapshots come from the same process lifetime; the tool cannot verify it.
3. **Hypothesis:** blocked request path, exhausted pool, active work or cyclic dependency.
4. **Confirmation:** matching request/throughput/CPU evidence or JVM's own diagnostic, as actually supplied.

A worker waiting in a queue may be healthy. A RUNNABLE socket/native frame may be waiting for external work. A long-lived identical stack can still represent many repeated calls. A detected monitor cycle is strong static evidence of that cycle, but no cycle is not a health certificate.

## Useful next evidence

Use an already available collection mechanism only if the user requests collection and the host can do it. Prefer another bounded snapshot with actual timestamp and process identity. Do not install Arthas/VisualVM, connect to a remote JVM or restart a process for an inspection request. Keep production dumps out of synthetic examples and repository history.
