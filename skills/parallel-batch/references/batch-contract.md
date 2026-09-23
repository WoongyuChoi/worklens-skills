# Batch manifest

Before dispatch, record:

| File/unit | Owner | Rule | Dependency | Status | Evidence |
|---|---|---|---|---|---|
| relative path | one worker | accepted rule | none or explicit | pending | empty initially |

Allowed states: pending, running, changed, unchanged, excluded, blocked, verified.
Use worker-specific output files; only the coordinator edits the manifest.

Independence means both file independence and resource independence:

- Shared schema/configuration/generated sources are coordinated first.
- Tests using shared fixtures, ports or output folders run sequentially.
- An interface used by another unit is fixed before that unit starts.
- A worker discovering an out-of-scope need reports it and stops that portion.

Start with a small batch and no more than two workers. Increase only when the host and model capacity justify it and the task benefits.
Keep all work sequential when the host lacks actual agent tools.
Report actual worker execution, not role-played parallelism.
After worker completion, compare outputs to the accepted example and account for every candidate, including excluded and unchanged files.
