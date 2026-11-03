# Business date and instant rules

## Model the value before fixing it

| Meaning | Typical Java type | Question |
|---|---|---|
| A business day such as settlement date | `LocalDate` | Which calendar/region and cutoff define it? |
| Wall-clock value without a known zone | `LocalDateTime` | Which zone or offset, and how are gap/overlap cases resolved? |
| An absolute event time | `Instant` | How is it rendered or grouped into business dates? |
| A zoned appointment | `ZonedDateTime` | Must wall-clock recurrence or absolute elapsed duration be preserved? |

Do not turn a business date into an instant by silently adding UTC midnight. Do not derive “today” with the host default zone when the business zone is explicit. `LocalDateTime` has no unique instant without zone/offset interpretation. `Instant` is not itself a business calendar date.

## Calendar intervals

For a monthly period whose business contract is “all events in that local month”:

```java
LocalDate startDate = month.atDay(1);
LocalDate nextDate = month.plusMonths(1).atDay(1);
Instant start = startDate.atStartOfDay(businessZone).toInstant();
Instant next = nextDate.atStartOfDay(businessZone).toInstant();
boolean included = !event.isBefore(start) && event.isBefore(next);
```

This is a contract example, not a universal database binding prescription. `atStartOfDay(zone)` applies the zone's actual rules; rare midnight transitions may move to the first valid time. For a specified cutoff other than midnight, derive both local endpoints using that cutoff and explicitly handle gaps/overlaps. A local day can have a non-24-hour duration.

For compatible stored values, SQL is often `event_time >= :start AND event_time < :next`. Bind values in the column's documented representation. Do not bind an `Instant` to an unzoned local column and assume the driver preserves the intended boundary. Avoid `23:59:59.999` unless the actual precision and contract justify it; finer values may be lost. Adding one month to January 31 is not the same operation as finding the first day of the next monthly interval.

If the approved rule really is inclusive at both endpoints, preserve and test that requirement while explaining overlap consequences. Do not automatically rewrite every `BETWEEN` predicate.

## Common failure boundaries

- `Date.toString`, JSON formatting, UI parsing and JDBC conversion can display the same instant with different dates. Compare values and explicit zones before calling it data corruption.
- ISO date-only input should remain date-only until the business rule supplies a time and zone. Browser date parsing and local formatting can shift a date if code treats it as an instant.
- `Duration.ofDays(1)` is elapsed time, not always the next local calendar day. Calendar operations and elapsed durations answer different questions.
- Week-based year formatting differs from calendar year formatting in date patterns. Inspect the exact formatter, locale and expected business label around year boundaries.
- SQL columns and driver mappings differ. In Oracle, a `DATE` includes a time-of-day at second resolution and no time zone; it is not identical to Java `LocalDate`. Verify actual schema and mappings before diagnosing.
- Business-day calendars require an actual maintained calendar, including substituted holidays and organization-specific closure rules. Weekday arithmetic cannot establish those rules.

## Boundary assertions

Choose expected endpoints independently from the function under test. Do not compute both expected and actual using the same faulty helper. Record original inputs, zone ID, clock instant, effective local date, endpoint values and precision. An optional JDK execution verifies that Java example only; SQL semantics require existing DB evidence or an available safe integration environment.
