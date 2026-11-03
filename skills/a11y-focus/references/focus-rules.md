# Keyboard and focus rules

## Native first, semantics second

Use a real button for an action and an anchor with a real destination for navigation. Styling a div as a button does not provide native keyboard activation or disabled behavior. Do not add a keydown handler that doubles a native button's Enter/Space activation.

ARIA describes semantics; it does not implement focus movement. Verify the visible label and accessible name, relationships, expanded/selected state, and the event behavior together. An inaccessible icon label may block the same workflow, but keep this review bounded to the target widget.

## Modal lifecycle

1. Save the actual invoking element before opening, unless there is a better documented workflow target.
2. On open, move focus to a meaningful element: an introductory static heading with programmatic focus, the first useful input, or the least destructive action where appropriate. Do not always focus the first DOM button.
3. A modal makes background interaction unavailable. Native `dialog.showModal()` supplies different behavior from an `open` attribute alone. Inspect supported project browsers and actual behavior before relying on it.
4. A custom modal needs a complete Tab cycle, background isolation and Escape/close behavior consistent with the workflow. Do not trap focus on ordinary non-modal popups. Recompute eligible targets after dynamic changes; avoid stale NodeLists.
5. On close restore focus to the invoker if it still exists and is usable. If it was deleted or disabled, move to the nearest meaningful remaining row/control and state the fallback. Do not focus `body` as the success condition.
6. Confirm nested dialogs and rerenders do not steal focus back after closure. Removing a focused node without a fallback is a distinct failure path.

`aria-modal="true"` alone does not prevent background interaction. `aria-hidden` alone does not prevent keyboard focus; never hide an ancestor of the focused element without relocating focus.

## Composite patterns

| Pattern | Tab behavior | Internal keys | Important distinction |
|---|---|---|---|
| Tree | Usually one Tab stop for the widget | Up/Down across visible nodes; Right expands or moves into children; Left collapses or moves to parent; Home/End when supported | Collapsed children must not remain reachable; focus need not mean selection |
| Tabs | Active tab in the Tab sequence; content follows | Orientation-appropriate arrows; Home/End when supported; activation may be manual | Automatic activation is appropriate only when panel availability permits the intended experience |
| Listbox | One composite entry; chosen focus strategy | Arrows move active option; selection model determines Space/Enter/modifier behavior | Do not invent multi-select modifiers without a specified interaction model |
| Grid/treegrid | Component-specific entry and internal movement | Cell or row navigation under the actual pattern | A visual table does not automatically need a grid role |
| Native select/input/button | Native behavior | Native keys | Avoid overriding browser behavior without necessity |

Roving tabindex: keep one eligible item at `tabindex="0"`, others `-1`; move actual DOM focus when the active item changes. `aria-activedescendant`: keep focus on the owning element, point at a real eligible descendant and maintain the visual active item. Do not combine the two unintentionally.

Disabled behavior varies by pattern: ordinary disabled form controls normally leave the Tab order, while some composite patterns keep disabled items discoverable. Inspect the chosen pattern instead of globally deleting disabled items from every navigation list. Use `tabindex="-1"` for programmatic focus only when appropriate; avoid positive values.

## Small reproduction example

Synthetic source:

```jsx
{open && <div role="dialog" aria-modal="true">
  <button onClick={() => setOpen(false)}>닫기</button>
</div>}
```

This establishes a role but shows no opening focus, background isolation or restoration. These are static gaps, not proof that no surrounding wrapper supplies them. Inspect the owner before raising a definite finding.

한국어 확인 기록 예시:

| 동작 | 관측 | 판정 |
|---|---|---|
| Enter로 팝업 열기 | 코드에 trigger만 확인, 앱 미실행 | 정적 확인 |
| Escape로 닫기 | 실제 조작 자료 없음 | 확인 못 함 |

Reference basis: W3C APG keyboard interface and the specific widget patterns. Bundled rules are a bounded working guide; an offline review does not claim conformance certification.
