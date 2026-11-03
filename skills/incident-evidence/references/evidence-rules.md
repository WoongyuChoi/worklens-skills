# Incident evidence rules

## Time is an observation with a source

The tool accepts timestamps at the start of a line, optionally preceded by `[`: `YYYY-MM-DD[T or space]HH:mm:ss[.or, fraction of 1..3 digits][Z or ±HH:mm]`. A whitespace, closing bracket or line end must follow. Dates are calendar-validated; seconds 60 and unsupported fractions/formats remain unresolved. No epoch, localized date, time-only, IANA timezone/DST or arbitrary prefix guessing is performed.

`offsetMinutes` is a known fixed offset for that source's zone-less rows, between -840 and +840. Explicit row offsets take precedence. Missing offsets leave records unresolved. Different hosts may still have clock skew; UTC conversion does not correct it. Same-time rows use source/line ordering only for stable display. It is not causality.

Continuation lines attach to the preceding record to retain stack traces. Timestamp-looking unsupported rows break that attachment and remain untimed, so a new event does not silently become a prior stack trace. Inspect raw lines when the log format contains unmarked independent messages. Limits: 8 sources, 2 MiB total characters, 20000 lines/source, 10000 timed records. The UI shows bounded previews; JSON retains all accepted input records. Query filtering affects the known-time timeline/CSV only; unresolved evidence remains visible.

## Keep three columns separate

| Fact | Hypothesis | Missing evidence |
|---|---|---|
| request 0012 timed out at source line 2 | connection pool exhaustion | active/idle/waiting counts during the window |
| a configuration check was recorded | the check restored service | successful user-visible result after the check |
| two hosts logged adjacent times | one action caused the other | common request ID, ordering guarantee and clock uncertainty |

Do not replace IDs with numbers. Do not identify a culprit or root cause merely from repeated names/messages. Cite exact original lines, including contradictory evidence. Mark unknown impact, owner, deadline and recovery checks explicitly. An operator note is a source claim; label it as such until independently corroborated.

## Output and runbook

Result JSON contains original text and may be sensitive. CSV exports only the currently filtered, resolved-time rows; formula-like cell prefixes are quoted and prefixed for spreadsheet safety. JSON retains raw text unchanged. Unresolved records stay in JSON/report, not silently in a sorted CSV. No external service or analytics is used.

A useful runbook step has a confirmed prerequisite, bounded action, observable success, stop/escalation condition and recovery limit. Preserve unknowns; do not turn a proposed production command into an executed or tested instruction. Keep concrete prevention actions tied to evidence rather than generic reminders.
