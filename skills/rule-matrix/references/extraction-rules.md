# Decision-table extraction

Keep the extraction bound to the requested function/query and directly relevant dependencies.

- Give every row a local ID, source location, exact predicate, interpretation, outcome and exception/unknowns. Use declaring type/module to distinguish identical meta names.
- An ordered decision list is not an unordered truth table. Preserve first-match behavior, guard clauses and independent checks. Record overlaps and the branch that wins.
- Track effects before return or exception. An exception can prevent later assignments; a finally block can still run.
- Respect operator precedence, short-circuiting, mutation between conditions and calls that can fail. Avoid expanding unknown helper behavior into invented rules.
- SQL NULL produces UNKNOWN for many predicates. WHERE excludes UNKNOWN; CASE falls to a later arm or ELSE. SQL dialect can affect conversion, rounding, collation and empty strings; detect it or leave semantics unresolved.
- Do not merge empty, missing, null, zero and false without source evidence. Record exact boundary operators (<, <=, >, >=).
- Inspect SQL/XML when the relevant policy is outside the service. Generated classes require a source-of-truth reference before any proposed edit.
- Current implementation is evidence of current code behavior, not evidence of business approval. State policy conflicts separately.
- Static traced examples should use independent representative inputs and include default and exception paths. Claim execution only if the actual runtime was invoked.
