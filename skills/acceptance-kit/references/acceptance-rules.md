# Human acceptance checklist

Start from actual requirements and real screen labels. Each row must be executable without implementation knowledge.

Required columns: case ID, priority, preparation, action sequence, expected observable outcome, evidence source, actual outcome, evidence file, status.

Use 미실행 for new cases. A designed case is never 통과. If the expected behavior is not established, mark 확인 필요 and name the decision rather than inventing it.

Include the primary journey and material error/permission/state cases. Keep each action concrete: which button, which synthetic value and what to observe. Include setup/reset requirements when the first case changes the state for the next.

Do not embed credentials, real customer records or server-specific commands in a business user's checklist. Describe role capabilities and test-data requirements instead. Repeated meta field names need the relevant screen/type context.

Do not assume screenshots prove interactions, disabled state, persistence or authorization. Read implementation/requirements or mark the expectation unresolved. The agent's static walkthrough of the table is not execution by a business user.

CSV cells with untrusted formula-like text need spreadsheet-safe escaping; preserve exact machine fixtures separately. A Markdown table is sufficient when the set is small.
