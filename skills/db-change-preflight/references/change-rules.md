# Change rules

## Bind analysis to the actual engine

- Record Oracle/PostgreSQL/other engine and deployed version; do not transplant another engine's transactional DDL, online-index or default-column behavior. Use locally supplied version-specific documentation when available; unresolved version dependencies remain explicit.
- For ordinary Oracle DDL, account for an implicit commit before syntactically valid DDL and after successful DDL. A DDL that fails can therefore still leave earlier DML committed. Do not group a mixed DML/DDL script into a fictitious atomic transaction.
- Consider synonyms, schema qualification, editions and database links when present. A matching unqualified table name may resolve differently for another user or environment. Do not expand automatically into every schema.

## Data compatibility

| Change | Evidence to inspect |
|---|---|
| VARCHAR2/CHAR size or semantics | `BYTE` versus `CHAR`, actual length distribution, database character set and application limits. Character count alone does not prove byte-width safety. |
| NUMBER precision/scale | Ranges, fractional values, rounding/overflow consequences and JDBC/Java conversions. A wider precision with a lower scale can still lose information. |
| NOT NULL / key / UNIQUE | Full relevant-population null/duplicate evidence, existing validation state and concurrent writes during transition. |
| DEFAULT or DEFAULT ON NULL | Existing versus future rows, omitted column versus explicit null, actual version and datatype behavior. Do not assume all historical rows are physically rewritten. |
| Rename/drop/type conversion | Referenced code, preserved source values and reversible mapping. Lost/truncated data cannot be reconstructed from the new DDL alone. |
| New foreign key/check constraint | Existing violations, validation/enforcement mode, referenced keys and future-write behavior. |

Distinguish a condition that can cause ALTER to reject the change from actual data truncation by a separate UPDATE/conversion/import step. Never claim a shrink silently truncates every existing row without engine-specific evidence. Preserve original numeric identifiers as strings in reports and sample data.

## Application compatibility

- Inspect SQL column names, positional `INSERT ... VALUES` without a column list, `SELECT *` consumers, ORM/Mapper result shapes, DTO widths and stored code dependencies. “Adding a column is always backward compatible” is unsafe for positional contracts.
- Follow writes as well as reads. An old writer can keep filling the old column during backfill; a new reader can observe partial conversion. State the reconciliation rule and ownership while both versions run.
- Inspect indexes/constraints/triggers touched by the change and generated source ownership. Compilation or invalidation may be relevant even when application text does not contain the renamed column.
- Separate known consumers from external jobs, reports or integrations not supplied. A no-hit search is not evidence that an object has no consumers.

## Staging and recovery

1. **Expand:** Add compatible structure only where needed. Verify old code still reads/writes correctly and capacity/locking assumptions are addressed.
2. **Adapt:** Deploy compatibility reads/writes or an explicit single-writer transition. Define authoritative value and reconciliation if dual writes are used; dual writing is not automatically atomic across separate transactions.
3. **Backfill:** Preserve original information, define a restartable key/range and detect concurrent updates. Avoid a destructive cleanup merely to make the new constraint pass.
4. **Switch:** Compare relevant row counts/keys/values, then route readers and writers. State the old/new-version coexistence boundary.
5. **Contract:** Remove old structure only after all known consumers and recovery requirements permit it. Treat this as an information-loss boundary if old data is discarded.

For each stage, define a concrete exit check and recovery mechanism. A reverse rename can restore a name but cannot recover deleted values or newly incompatible writes. “Backup available” requires evidence of the relevant data/version and restoration procedure; do not invent backup completion or restore testing.

## Optional verification SQL

Keep queries read-only, scoped to known objects and labeled 미실행 검토안. Choose queries that resolve a real uncertainty (oversize byte lengths, null counts, duplicate business keys, mismatched backfill values). State that full scans may be expensive and let existing operational procedures govern execution; do not initiate them here. An estimated row count or sampled export does not replace a full-population constraint check.

## Reference basis

[Oracle 19c COMMIT semantics](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/COMMIT.html) documents DDL commit boundaries. This is a provenance link, not required online access. Apply the deployed engine/version and special-object behavior where relevant.
