# QA evidence ledger

Use one row per meaningful acceptance condition:

| Condition | Method | Final-state evidence | Status |
|---|---|---|---|
| User-visible behavior | actual interaction/test | observed output | executed / failed / not run |
| Local code rule | source inspection | path and location | static only |

In the Korean output translate statuses to 실행 확인 / 정적 확인 / 실패 / 확인 못 함.

Evidence must include:

- Task scope and changed-file basis.
- Command or browser action, working directory and result.
- Exit code for commands when available.
- The revision or file state checked; invalidate affected checks after edits.
- Reproduction condition, impact and source location for defects.
- Clear boundaries: no browser, no compiler, no database, unavailable service.

Avoid false positives:

- Confirm the caller, type/module and relevant branch.
- Respect documented domain behavior.
- Distinguish a theoretical risk from a reproducible failure.
- Do not equate a matching meta-field name with identity.
- Do not report missing source as definitely missing implementation.
- If reviewing an unavailable service, supply the smallest next check; do not mark it passed.

For offline HTML, verify literal markup input is inert, source values keep their precision, no external requests occur, controls work, and large/invalid inputs fail visibly.
