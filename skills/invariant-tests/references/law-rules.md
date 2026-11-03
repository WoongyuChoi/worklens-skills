# Choose a valid relation

## Relation candidates and traps

| Candidate | Required contract | Counterexample to check |
|---|---|---|
| Idempotence: `f(f(x)) = f(x)` | Output is a canonical form accepted as input | An enrichment step intentionally appends a new event |
| Permutation invariance | Input order has no business meaning | First-match discount or ordered balance calculation |
| Partition/additivity | Operation is additive under the same units and rounding stage | Per-item rounding differs from total rounding |
| Round trip: `decode(encode(x)) = x` | Encoding is lossless over the stated domain | Normalization, omitted nulls, limited numeric precision |
| Monotonicity | A named input increase cannot decrease the named result | Threshold discounts, caps or negative adjustments |
| Conservation | Every unit is allocated once under defined rounding | Unallocated residue or allowed loss in transformation |

Declare domain and preconditions before running. A precondition such as “amounts fit the documented numeric type” can be legitimate. A new precondition such as “exclude the input that failed” needs independent contract evidence; failure alone never justifies it.

## Rounding example

With HALF_UP rounding to integer units:

- Round each of `0.4` and `0.4`, then add: `0 + 0 = 0`.
- Add first, then round: `round(0.8) = 1`.

Therefore unrestricted partition additivity is invalid for the first policy compared with the second. Do not discard `0.4` inputs to force the law. Adopt a different relation that follows the approved rounding stage, or use independent literal expected cases.

## Avoid self-validating expectations

Bad: assert `productionTotal(rows)` equals `rows.stream().map(theSameProductionHelper).sum()` when the likely error is inside that helper.

Better: a valid order-independent contract allows comparing outputs after a permutation, while literal anchor cases check amounts. Even this combination only covers the tested cases. A constant-zero implementation passes permutation invariance, so include a nonzero anchor whose correctness is independent of the target.

For inverse relations, a matching bug in both encode and decode can hide a defect. Add known-format examples or an independently specified representation. Passing a round trip does not prove interoperability with other systems.

## Failure triage

1. Retain the full failing input, seed, environment and original relation.
2. Confirm it satisfies the declared domain.
3. Verify the law against the approved business contract, not the code.
4. Reduce input manually while rerunning the same assertion, if tools are available.
5. Report law invalid / product defect candidate / environment or harness issue / unresolved.

Do not call a hand-traced relation an executed test. Do not claim shrinking, distribution coverage or a property-testing framework when using a finite deterministic loop.
