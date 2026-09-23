# Interaction checklist

For the actual requested screen, verify:

- A reader can see the page purpose and primary action without opening help.
- Search/filter, selection, create/edit, cancel and reset work if visible.
- Invalid fields produce Korean errors near the form; invalid data is not committed.
- Empty results have a recovery action, not a blank page.
- Dialog focus enters the dialog, Escape closes it and focus returns sensibly.
- A status has a text label, not color alone.
- User input is rendered as text, including angle brackets and quotes.
- A narrow viewport does not hide the primary action; tables can scroll inside their container.
- All data is synthetic or explicitly provided. There are no production URLs, external fonts, analytics or fetch calls.
- Mock saves are labeled as temporary; reload/reset behavior matches the label.
- Remove controls that the prototype does not implement. A toast alone is not implementation of a promised export or save.

Record what actually ran. If no browser is available, state: 정적 확인; 화면 동작은 확인 못 함.
