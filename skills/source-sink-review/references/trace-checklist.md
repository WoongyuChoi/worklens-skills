# Trace checks by operation

Use only the relevant section. Trace the actual implementation and deployed configuration; these questions are not signatures or automatic verdicts.

## SQL construction

- Separate data values from identifiers, sort keys and SQL fragments. Verify parameter binding at the executed call, including wrappers and native-query paths.
- Check whether a request sort key maps to a fixed internal column. A value placeholder does not make a concatenated identifier safe. Read direction validation separately.
- For MyBatis, locate the caller and origin of a dynamic substitution. A fixed application-owned fragment and arbitrary user text have different control assumptions.
- Disprove the candidate when every reachable key maps to a finite literal and the direction has an effective enum check. Do not confuse a regex match or a function named `sanitize` with this proof.
- A string-builder witness can establish structural influence. Database parsing, schema access and downstream data impact remain untested without a permitted isolated database test.

## URL and resource selection

- Separate user-owned query data from control over scheme, hostname, port, resource type and redirect destination. Trace relative URL resolution and configuration binding.
- Check the parsed destination against a fixed policy, not a substring. Determine whether redirects, proxy behavior, DNS changes and resolved address selection are controlled at the component that sends the request.
- For resource loaders, inspect supported schemes and the authority allowed to choose the resource. A high-privilege descriptor setter is not automatically an anonymous input path.
- A `new URL(...)` result is a plan, not evidence that an HTTP request happened. Do not probe metadata endpoints, enumerate addresses or fetch external canaries during a source review.

## File operations

- Trace decoding, normalization, path joining and filesystem resolution in order. Test containment using path components, not a textual prefix such as `startsWith(root)`.
- Resolve the canonical root and existing target when symlinks are possible. Check who can modify directories or links between validation and open. A `realpath` check alone does not eliminate a concurrent replacement race.
- For creating files, reason about the nearest existing parent, link following and the actual open mode. Do not apply an existing-file recipe blindly.
- Disprove a candidate only for the observed policy and filesystem assumptions. Use a synthetic sibling file in a private temporary directory for a local witness; never read an actual file outside the authorized review scope.

## Template and process operations

- Distinguish an application-owned template with untrusted data from an input-controlled template name or template program. Inspect the configured loader, permitted roots and fallback resolution.
- For a process, record executable selection, argument boundaries, shell involvement, environment and working directory. A fixed argument array removes one shell boundary but does not necessarily remove option injection or application-specific argument semantics.
- Prefer observing a selected template, command plan or argument array. Do not invoke a shell, execute a template expression, spawn a process or construct a destructive payload solely to demonstrate control.

## Cross-cutting counterevidence

- Record authentication and authorization on the actual reachable path, including internal callers. If subject/object access is the main uncertainty, hand the bounded request matrix to `api-authz-probe`.
- Check whether the proposed attacker already has the claimed capability. Evaluate a lower-privilege misuse separately from a documented administrator feature.
- Record the original input, transformations, control decision, value reaching the sink and observed effect. Keep an error response distinct from a stopped side effect.
- A retry with unchanged input and unchanged environment adds no new coverage. Stop at the declared budget and report the unresolved condition.
