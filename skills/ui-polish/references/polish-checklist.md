# Scoped polish checklist

## Evidence before editing

Inspect existing screen components, design tokens, neighboring pages and the provided screenshot. Find the main user task, action hierarchy and information density. Preserve the project's established system, including older enterprise UI conventions when functional.

## Narrow changes

- Fix related grouping, baseline alignment, spacing and table hierarchy before decoration.
- Keep main and destructive actions distinguishable using labels as well as color.
- Read Korean labels at normal text sizes. Test wrapping, long labels, numbers, zoom and dense tables when a real renderer is available.
- Preserve keyboard focus, labels and a sensible order. Do not remove focus outlines or rely on hover to expose required actions.
- Match loading, empty, error, disabled and success states to real application behavior. Do not make a fake save-success state for a failed request.
- Reuse existing shared components and styles without expanding the change into a redesign of every screen.
- Keep identifier strings and financial values exact; visual cleanup must not truncate significant digits or hide a required field.

## Verification evidence

Record source paths, changed behavior (if any), rendering tool actually used, sizes inspected, keyboard checks and any existing build result. Static CSS inspection is not visual QA. If no renderer is available, give a concise limitation and leave unsupported visual judgments tentative.
