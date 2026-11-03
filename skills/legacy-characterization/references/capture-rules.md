# Capture observed behavior

## Capture ledger

Record: source identity (revision or preserved file copy), command/runtime, input fixture, initial state, observed output, exception type/message where meaningful, visible side effects, timestamp and environmental assumptions. A timestamp alone does not identify the source. A screenshot may document visible behavior but is not enough to assert hidden database effects.

Capture before modifying the target. If it has already changed, use an available original copy or explicitly mark the baseline unavailable. Do not reconstruct a remembered result as evidence.

## What to freeze

| Surface | Good baseline | Risk |
|---|---|---|
| Pure calculation | Literal input/output pairs with numeric scale policy | Copying the same formula into expected values |
| Serialization | Observed field presence, names, nulls and contractual order | Broad replacement that hides missing fields |
| Error handling | Observed exception/category under known conditions | Depending on volatile stack addresses |
| Query adapter | Existing stubbed response mapped to observed output | Claiming a mocked call proves DB semantics |
| Side-effecting code | Existing safe local test harness with observed calls/state | Running production jobs to obtain snapshots |

Numbers that represent identifiers remain strings. Preserve null vs empty vs absent. For floating-point and decimal calculations, document the contract's tolerance or exactness rather than selecting a loose epsilon after seeing failures.

## Volatility controls

Use a passed Clock, supplied random seed, fixed locale, existing test double or captured authorized service response when such a seam already exists. Introducing a seam is a source change: keep it minimal and test that production defaults remain consistent if authorized. Do not add a dependency merely to freeze time.

A normalization rule needs a reason and counterexample. Replacing a generated trace ID can be acceptable when only its presence matters; deleting every number would conceal wrong amounts. Sorting a report can hide a ranking bug. Preserve the raw observation beside the normalized fixture and report what is no longer checked.

## Synthetic walkthrough — not a recorded production run

Suppose a legacy invoice calculation for input `amount="100.00", rate="0.075"` is **actually run in an existing local harness**, and the resulting text is `"107.00"`. A different rounding rule might suggest `"107.50"`, but a characterization test records the observed `"107.00"` until a business decision changes it. The example values here are fictional, not evidence for any repository.

A useful capture record would say:

> 기준 상태: 보존한 원본 파일. 입력: 위 합성 입력. 관측 출력: 실제 실행 후 기입. 업무 적합성: 별도 확인. 기준 테스트: 관측값을 리터럴로 비교. 감도 확인: 반환 금액을 임시로 변경한 격리 사본에서 실패하는지 확인.

Do not turn this illustrative story into a prefilled result for the user's code.

## Sensitivity gate

Pick one plausible defect relevant to the behavior: omitting one mapped field, changing a comparison boundary, dropping a row or modifying a return amount. A syntax error is not evidence that an assertion detects the intended behavioral defect. If a mutant does not compile, call it 무효 변이. If the baseline was already failing, fix the harness understanding before interpreting a mutation.

Use a separate directory/copy or an existing safe test seam. After the check, prove the original file is restored and the original test passes. Do not change the baseline on a failing refactor without reviewing the behavioral difference.
