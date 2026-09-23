# Format rules

- Detect the delimiter from multiple complete records, honoring quoted cells. Prefer extension evidence for TSV. Let users override ambiguous CSV delimiters.
- Support quoted delimiters, escaped double quotes, CRLF and embedded newlines. Reject an unclosed quote. Never quietly shift a ragged row under the wrong headers.
- Preserve cell text, leading zeros and source order. Do not trim source values automatically. Duplicate or empty headers need distinct display labels, not overwritten keys.
- The viewer defaults to a header row and states that choice. Use its CSV/TSV first-row selector to include headerless data. When adapting the viewer for a known source, set the selector from evidence; ask once if the first row is ambiguous.
- Show null, empty text and missing values distinctly where the source supports that distinction.
- For JSON, retain numeric lexemes as strings when building a browser table. Standard JSON.parse rounds sufficiently large numbers. Offer raw text separately.
- For XML, reject DOCTYPE and parser errors, keep attributes and paths, and cap the displayed node count. Do not resolve entities or execute markup.
- The bundled viewer caps files at 5 MiB, table records at 20,000, XML element traversal at 20,000 and DOM display at 100 records per page. Exceeding a bound must be explicit; never label a truncated count as complete.
- UTF-8 is the default. Provide an explicit EUC-KR/CP949-compatible browser decoder choice for legacy text. If decoding is lossy, stop and ask the user to choose the original encoding.
- Render all file-controlled strings with textContent. Never turn source data into innerHTML, event handlers, links or downloadable executable code.
- Browser file access means the user selects the file. A local HTML cannot silently read an arbitrary adjacent path.
