# Encoding boundary guide

## Inspect the operation, not just the displayed glyph

| Question | Evidence to retain | Common false inference |
|---|---|---|
| What does the limit count? | Protocol/schema and exact code | Java String.length counts bytes |
| Which charset produced the bytes? | Explicit setting plus original bytes | A successful decoder proves original encoding |
| Was information already lost? | First invalid byte range or replacement character | A visible replacement character can always be recovered |
| Does normalization belong to the contract? | Business/protocol rule | Visually identical text always has identical bytes |
| What is the runtime default? | Actual JDK/config value | All Java installations follow the OS default |

Java UTF-16 code units, Unicode code points, grapheme clusters and encoded bytes are different measures. A supplementary character uses two UTF-16 units. A combining sequence can use multiple code points for one displayed grapheme. The tool reports no grapheme count.

Java 18+ standardized the default charset to UTF-8 with compatibility/configuration considerations. Inspect the actual supported JDK and the specific API. Explicit encodings at file, protocol and JDBC boundaries remain necessary for a reliable diagnosis. Do not introduce a new JDK just to run this skill.

## Tool contract

Input `mode` is text (UTF-8 only), hex (pairs separated by optional whitespace) or bytes (integer array). `charset` is an explicit browser TextDecoder label. Legacy labels follow that implementation's mapping; a peer's Oracle/JDK character set may differ. `limitBytes` is optional, integer 0..131072. Decoding retains BOM via ignoreBOM and preserves the original hexadecimal bytes. Invalid sequences are flagged; the replacement-character rendering is only a preview.

The safe-prefix suggestion exists only for a valid UTF-8 input. It does not solve fixed-width padding, terminators, field delimiters or peer charset policies. All per-character byte offsets are derived UTF-8 offsets, not original legacy-charset offsets. Original bytes remain available in result JSON. The UI table caps code points at 2000; aggregate counts cover the whole bounded input.

## Synthetic counterexamples

- `가A😀`: 4 UTF-16 units, 3 code points, 8 UTF-8 bytes. Cut at byte 5 is invalid; byte 4 is valid.
- `é` versus `e` plus U+0301: visually similar, different code-point and byte lengths. Do not silently normalize.
- UTF-8 `EF BB BF 41`: BOM plus A. The BOM is retained; it contributes to bytes and displayed-text counts.
- Invalid UTF-8 `EA B0`: incomplete Korean code point; another decoder succeeding does not identify the source charset.

Primary semantics: Java Charset API and the WHATWG Encoding standard. See repository docs/SOURCES.md for upstream inspiration and links. Implementation is original; no upstream runtime code is bundled.
