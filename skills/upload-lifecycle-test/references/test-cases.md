# Upload lifecycle case selection

Select cases from the application's real contract. Do not run every row as a generic scanner. Use one small original witness, a different nearby variant and a legitimate control. Keep per-file and whole-batch decisions distinct.

## Case matrix

| Boundary | Useful small case | Evidence needed | Normal control |
| --- | --- | --- | --- |
| Optional multi-file fields | An empty entry adjacent to a real file that violates a known rule; vary position/order | Which entries were checked, decision for each non-empty item, stored rows after rejection | A valid batch with an optional empty item |
| Whole-batch policy | One valid and one disallowed file | Whether rejection leaves no rows or intentionally retains valid items under the documented contract | Two valid files |
| Publication state | Retrieve the same synthetic object before review and after the permitted transition | Exact object ID, state, retrieval route and canary visibility; include thumbnail/static aliases if they exist | Approved object remains retrievable |
| Review failure | A rejected or failed-review object | Retrieval denial and expected temporary-storage cleanup | Accepted review publishes exactly the intended object |
| File identity/type | A declared type and benign body/name that disagree with policy | Validator result and actual stored/download response, not only client metadata | A valid file of each necessary supported type |
| Storage identity | Duplicate names, separator/normalization variants supported by the target OS | Server-owned storage key, actual final path and overwrite effect | Ordinary display name with preserved user-visible semantics |
| Archive extraction | A tiny archive or path fixture with a link/duplicate entry, if the application extracts archives | Actual extractor and filesystem behavior; emitted-byte/count limits and final write target | One ordinary small entry |
| Deletion/cleanup | Delete only a test-created object after a failed or successful flow | Object reference, storage removal and retrieval result | Unrelated fixture-owned object remains intact |

## Evidence discipline

Record these facts for each executed case:

1. The application function or route reused, relevant current configuration and synthetic starting state.
2. The request's file count, per-file metadata and small marker; omit actual company file bodies.
3. The response meaning, recorded state, retrieval effect and leftover resources.
4. The same observations after the patch, plus a distinct variant and valid control.
5. Which layers were simulated: review service, database, filesystem, proxy, browser rendering or archive parser.

For a suspected validation shortcut, do not stop after a rejection status. Verify that no forbidden object was already persisted or published. If the product intentionally uses partial success, check each item's outcome and state instead of imposing atomic behavior.

For a pending-file claim, show that the observed bytes belong to the same synthetic object and that its state is still pending. An unrelated cached response, login page or generated ID alone is insufficient. A `404` or `403` with the canary still in its body does not pass.

For preview/download behavior, compare actual `Content-Type`, `Content-Disposition` and `X-Content-Type-Options` with the intended serving model. Uploaded active content needs a suitable serving/origin policy; a filename extension alone is not that policy. Do not execute an uploaded program to prove that an unreviewed file is publicly retrievable.

## Archive and operating-system limits

Treat string normalization, archive interpretation and filesystem traversal as different layers. Resolve existing path components; inspect symlinks, hardlinks, missing-path fallbacks, overwrite behavior and the final open/write operation. A lexical containment assertion is not a race-free guarantee. Prefer rejecting links when the product does not need them.

Run archive examples only with tiny files in a fresh disposable directory and the already available application parser. Never write outside the designated fixture parent. Keep decompression and entry-count tests bounded; do not use a compression bomb or load test to demonstrate a missing limit.

Windows drive-relative, UNC/device paths, trailing-dot behavior, filesystem permissions and link privileges are target-specific. On another OS, a string-policy test can establish the selected function's decision but cannot establish the target OS's resolution behavior. Mark the latter as untested.

## Korean report wording

- “합성 첨부 ID의 상태는 검사 대기였고, 다운로드 응답에서 같은 표식이 확인되었습니다. 이 관측은 실행한 로컬 경로에 한정됩니다.”
- “수정 후 같은 요청과 입력 순서를 바꾼 요청을 다시 실행했습니다. 정상 파일 처리도 유지되는지 별도로 확인했습니다.”
- “현재 환경에는 실제 압축 해제기와 Windows 파일시스템이 없어 경로 함수의 판단만 확인했습니다. 운영체제에서의 추출 효과는 미실행입니다.”

Use those sentences only when the actual observations support them. Do not copy example outcomes into an unexecuted report.
