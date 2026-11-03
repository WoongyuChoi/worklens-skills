---
name: code-path-tour
description: "Build an evidence-anchored, self-contained HTML walkthrough of an actual code path across UI, API, service, mapper, and SQL files. Use when a user asks how a concrete request reaches its implementation or needs a maintainable handover tour; do not use for generic architecture diagrams or simulated runtime execution."
---

# Code Path Tour

Explain one concrete operation through observed source files and explicit call/binding evidence. Produce a portable HTML tour that remains useful without an editor extension or network.

## Working contract

- Work offline from files the user provides or the host can actually read. Do not require repository services, Git, an IDE extension, Python, package installation, or new libraries.
- Write explanations and labels in Korean. Preserve source snippets, identifiers, paths, and their line ranges.
- Reading a call site confirms source structure, not that the path executed. Separate code observations, inferred transitions, and missing evidence.
- Never fabricate source anchors, snippets, commits, endpoint bindings, or successful tests. If files are unavailable, make a clearly labeled gap and state the next file needed.
- Keep one tour focused on one user operation or failure path. This is not a replacement for general documentation or a broad architecture diagram.

## Workflow

1. Identify the concrete entry action, endpoint, or method. If the user is vague, start from a supplied named operation and state that assumption; do not delay for a broad setup questionnaire.
2. Read the entry file and follow actual references. Common paths include event handler → API wrapper → route binding → controller → service → mapper statement → SQL/result mapping → rendered response. Include only layers that exist in the supplied project.
3. Record each step immediately: source path, exact start/end line, enclosing symbol, a short verbatim snippet, and why the step matters to the operation. Prefer a small coherent snippet over an entire class. Read enough surrounding code to avoid omitting relevant branches or aliases.
4. Record transition evidence independently from node evidence. A method with a matching name is not proof of a call. Match imports, receiver/type, route plus HTTP method, mapper namespace/statement, or other concrete bindings. Mark unresolved reflection, generated clients, dynamic dispatch, or missing XML as inferred/gap.
5. Include relevant early returns, error handling, permissions, transaction handoffs, and alternative branches without turning the tour into a complete code audit. Explain a significant omitted branch and why it is outside this operation.
6. Create a JSON tour using `references/tour-contract.md` and `assets/example-tour.json`. Replace every synthetic example with actual evidence. Keep `provenance: "synthetic"` for demonstrations; use `"source"` only when the snippets were actually read. Record an available revision or the explicitly unknown revision, without requiring Git.
7. Open `assets/tool.html`, load or paste the JSON, inspect search, navigation, and transition links, and export the populated single HTML. Export JSON as the editable source. The tool validates structure and renders supplied text; it does not verify files or execute code.
8. Recheck the most consequential transition and at least one source anchor before delivery. If code changed meanwhile, mark anchors stale until reread. Report what was inspected and what was not executed.

## Deliverable

Provide the single HTML and editable JSON, plus a brief Korean answer: entry and result, important branch/error behavior, source basis and revision, inferred links/gaps, and execution status. The viewer supports no external assets and can be shared as one file.

If browser execution is unavailable but Node is already installed, generate the populated single HTML with `node <skill-folder>/scripts/export-html.cjs <tour.json> <new-tour.html>`. This validates the JSON, embeds it using the tested escaping routine and refuses to overwrite an existing file. Browser rendering remains unverified. Optional JSON validation uses `node <skill-folder>/scripts/tool.cjs <tour.json> <new-result.json>`; stdin/stdout is also supported when no arguments are given. If neither execution path exists, prepare the JSON and provide the unchanged tool with loading instructions rather than inventing a successful export. No Node installation is required to use the viewer.

## Example request

“이 조직 조회가 화면에서 SQL까지 어떻게 이어지는지 실제 코드로 안내해줘.”

Show the observed route and mapper binding with real snippets. Do not fill missing layers with a plausible Spring/React example.

## Resources

- `references/tour-contract.md`: field definitions, evidence rules, and limits.
- `assets/tool.html`: standalone viewer and populated HTML exporter.
- `assets/example-tour.json`: clearly synthetic four-step example.
- `scripts/export-html.cjs`: optional existing-Node exporter for a populated HTML without a browser.
