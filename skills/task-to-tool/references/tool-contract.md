# Reusable tool contract

Before coding, recover these from the accepted task:

| Field | Required evidence |
|---|---|
| Input | Concrete accepted sample and encoding/shape |
| Transformation | Ordered rules including user corrections |
| Output | Exact accepted result |
| Preservation | Order, whitespace, case, leading zeros, duplicates, precision |
| Failure | Invalid input must fail visibly without replacing a valid result silently |
| Runtime | Browser or a runtime actually present locally |
| Verification | Sample, empty, malformed, boundary, repeated-run behavior |

Do not make the user fill this table if the answers are already in context.
Keep switches off unless the accepted task requires the behavior.
Use safe text rendering. Avoid eval, dynamic Function and shell interpolation.
Use Blob downloads for browser output, revoke object URLs after use, and provide manual copy when clipboard permissions fail under file://.
Do not claim a text formatter is a full CSV parser. For structured data, implement its actual grammar.
If a one-off investigation cannot become deterministic without a model, explain that distinction and package a reusable agent workflow instead of a fake deterministic tool.
