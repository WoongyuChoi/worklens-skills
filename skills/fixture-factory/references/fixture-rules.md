# Fixture rules

- Trace every constraint to its defining type/schema and relevant runtime validator. An annotation's presence does not prove it is enabled for the actual request path or validation group.
- Distinguish a missing property, explicit null, empty string, whitespace and zero. Avoid accidentally giving a negative test two unrelated invalid fields.
- Check length semantics: bytes, Unicode code points and UTF-16 code units are not interchangeable. Java String.length, browser JS length and database byte limits can differ. Record the actual rule; do not blindly count visible characters.
- Use one valid baseline and deterministic mutations. Keep exact decimal and long-integer literals; do not serialize them through a lossy numeric representation. JSON numeric literals can be emitted exactly in text when the contract requires numbers.
- JSON schema examples, defaults and nullable annotations are not guarantees that the application fills values or accepts them. Code lists and referenced IDs need evidence. Unknown required values produce pending cases, not invented valid IDs.
- Keep dates fixed and within the supported format, time zone and business calendar. Include a leap-day or month-end boundary only when relevant to the rule.
- Use wholly synthetic data. Do not copy a real customer's name, address or identifier merely to make a realistic fixture. A random valid-looking identifier can belong to a real person; prefer explicit test values documented by the project.
- Name output cases and record payload, expected behavior, evidence source and state (정적 확인/실행 확인/확인 필요). Blank expectations are a gap, not a passed test.
- For SQL fixtures, detect the dialect and produce files only; do not run inserts or destructive cleanup. Do not guess surrogate-key sequences or bypass constraints.
- Keep raw JSON fixtures distinct from case-ledger CSV. CSV headers are Korean and any formula-like free text must be escaped for spreadsheet review. Keep exact payloads in JSON.

## Fixture collection shape

Use a JSON array of objects with `caseId`, `payload`, `expectation`, `evidence`, and `status`. The actual request is each object's `payload`. Keep valid/invalid collections separate. Put unresolved cases in a separate `pending.json` if needed and do not count them as validated valid/invalid cases.
