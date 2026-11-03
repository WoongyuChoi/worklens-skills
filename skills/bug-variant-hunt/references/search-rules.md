# Search rules

## Define a cause signature

Write an internal causal statement before choosing a pattern:

`input condition → operation under that condition → violated requirement → observable effect`

Include the fixed guard or invariant and what would make similar code safe. If the patch also renames variables or reformats code, exclude those cosmetic details from the signature. A test failing near a line does not alone establish that line as the cause.

## Search ladder

| Pass | Purpose | Example for a numeric-equality defect |
|---|---|---|
| Exact | Recover the known bad operation in the supplied baseline. | The old `amount.equals(expected)` call. |
| Same operation | Find renamed variables in the bounded module. | `.equals(` calls whose receiver resolves to `BigDecimal`. |
| Wrapped operation | Follow local wrappers that preserve the same semantics. | A helper comparing two amounts with `equals`. |
| Same cause, new syntax | Investigate only when evidence warrants it. | `Objects.equals` on two monetary values where scale is not part of equality. |

Do not generalize every dimension simultaneously. When a pass adds many unrelated hits, refine with type/caller evidence rather than silently reviewing a handful and reporting the entire set as clean.

Use the host's actual search facility. If `rg` exists, fixed strings are preferable when regex adds no value, for example `rg -n -F -- '.equals(' src/main/java/billing`. Discover matching files first, then read local context. Quote patterns safely; never interpolate untrusted code into shell command substitutions. Do not install an AST tool to complete the default workflow.

## Candidate decision

For each candidate, establish:

1. **Type/meaning:** Is it the same operation on the same relevant type, not an unrelated method with the same name?
2. **Reachability:** Which caller and input can reach it? Do guards, normalization, allowlists, ranges or validation exclude the original trigger?
3. **Order:** Does the protection run before the sensitive operation on every relevant path, or only afterwards?
4. **Intent:** Does the requirement match the original bug? Exact decimal representation, object identity or deliberate nullable behavior may be correct elsewhere.
5. **Consequence:** Does this operation affect a returned value, persistent state or visible decision? Dead/example code should not count as a production defect.

Keep uncertainty at the smallest claim: “same operation; requirement unknown” is a conditional candidate, not a confirmed bug. A guard in the method name is not evidence; inspect its implementation. Avoid proving absence of a guard by reading only the matching line.

## Evidence trail

- Original: pre-fix path/line or supplied snippet, failing input and known requirement.
- Search: literal pattern, actual roots, exclusions, returned hit count and inspected count. If the tool does not provide a reliable count, say not counted rather than inventing one.
- Finding: definition and caller path:line, concrete counterexample and minimal corrective invariant.
- Exclusion: one representative safe lookalike with its exact protective condition or different intent.
- Boundary: unloaded/generated files, other languages/modules and uninspected hits.

Do not report separate findings for the same helper and every caller unless they have independently different failure causes. When an actual agent tool is unavailable, perform sequential review and call it sequential; imagined reviewer roles do not add verification evidence.

## Fixing when authorized

Propose the least invasive correction that preserves each call's intent. Do not replace every `equals` with `compareTo`, every query with a prepared statement, or every exception handler with rethrowing solely because one defect used that pattern. Check the originally failing case plus a relevant safe case using the existing test environment, if present. Report the actual executed coverage and any behavior still inferred statically.
