# Findings: how `Cypress.stop()` reports the current test

This backs up [`ISSUE.md`](./ISSUE.md). It covers what I verified myself, what I inferred, and what I didn’t check.

## Environment I tested in

- `develop` at `d5fd0e6`, built from source (`yarn build`), not a released 16.3.0 binary
- `cypress run --dev` and `cypress open --dev`, bundled Electron (the run banner says “Electron 150 (headless)”)
- Ubuntu 24.04.5 x86_64 in a cloud container, Node 24.22.1, `retries: 0`
- `cypress open` was driven with Playwright over CDP under Xvfb, and I read the reporter from screenshots

## Answers to the brief

### 1. Reproduce both specs, including `cypress open` — **verified**

| Spec | `cypress run` | `cypress open` |
| --- | --- | --- |
| A (`cy.log()` then stop, in `beforeEach`) | `first` failed with `CypressError: Cypress test was stopped while running this command.` plus the `before each` skip note. `second` skipped. Exit code 1, failure screenshot taken, 4 s | `first` shows as running at 1.5 s and as **failed** by 8 s, with no error text and “No commands were issued in this test.” `second` not run |
| B (stop only, in `beforeEach`) | `✓ first (NaNms)`, `second` skipped, exit code 0 | `first` ✓ passed, `second` not run |

So your results hold, and `cypress open` has its own version of Spec A: the failure appears there too, a few seconds later and with no explanation.

### 2. Does the body of `first` run in Spec B? — **verified: no**

I replaced the body with a synchronous `console.log` marker and a `throw`. In both modes the marker never appeared in the output and the test was still reported passed (`✓ first (NaNms)` in `cypress run`). `NaNms` fits a test that never got a start time.

### 3. Why a queued command flips passed to failed — **verified by experiment, mechanism read from source**

The full trace with permalinks is in the issue draft. In short:

- **Command queued:** the hook returns the queue promise to mocha. `cy.stop()` → `endEarly({ canceled: true })` cancels that promise, so it never settles, and re-arms the runnable timer. The timer fires after `defaultCommandTimeout` and fails the hook with `test_stopped` (`mocha.ts:598`). In run mode the abort waits for `test:after:run` (`runner.ts:559`), so that late error is reported.
- **No command queued:** the hook returns synchronously and completes. `onRunnableRun` (`runner.ts:1673`) then calls `_next()` with no error for the test, and mocha records that as a pass.

Experiments that back this up:

- With `--config defaultCommandTimeout=9000`, Spec A fails after 9 s instead of 4 s, so the failure is that runnable timer.
- I temporarily changed `runner.stop()` to abort in run mode too, which is the pre-14.5.0 behavior, and rebuilt the runner. Spec A then exited 0 with both tests skipped. I reverted the change. The same experiment also reported a test that had **already passed** (stop in `afterEach`) as skipped, and it would drop the Test Replay event ordering that #31830 added. So a plain revert isn’t the fix.

### 4. Intended behavior per PR #31225 — **read; my conclusion is that this is a bug**

- #31225 only added the public type (`stop(): void`, “Stop the Cypress App on the current machine while tests are running”), a changelog entry and type tests. It changed no runtime code. The only review note asks whether “the cancelation spec is probably enough for tests”. Nobody discussed how the current test should be reported.
- The docs say a stop in `cypress run` “skips any remaining tests in the current specfile” and say nothing about the current test.
- #31830, which deferred the run-mode abort for #31781, added `system-tests/test/cypress-stop.spec.ts`. Every case there expects exit code 0, so a stop on its own was meant not to fail a run. Its snapshots also record `✓ should not run this test (NaNms)` for `before` and `beforeEach`. That pins the “passed without running” result, apparently without anyone examining it. I ran that suite on `develop` and all 5 cases pass.
- The docs’ own `beforeEach` example is Spec A (`cy.log()` then `Cypress.stop()`), so following the docs fails the run.
- #33465 reports that 14.4.1 passed and 14.5.0 and later fail. **Not verified by me**, since I didn’t install old versions. It fits the timing of #31830 and the revert experiment above.

Reporting a pass or a fail depending on an unrelated `cy.log()` doesn’t look like a design choice, so I’d file it as a bug.

### 5. `afterEach` after a failed test (the docs pattern) — **verified in `cypress run` only**

| Variant | Result in `cypress run` |
| --- | --- |
| Docs pattern as written (no command before the stop) | **Not affected.** `first fails` fails with its real assertion error, `second` is skipped, exit code 1 |
| `cy.log()` before the stop | Affected, mildly. Same counts, but an extra `"after each" hook for "first fails"` failure with `test was stopped…` is added, and the run takes 8 s instead of 4 s |
| Stop in `afterEach` after a **passing** test, `cy.log()` first | Affected badly. The passing test is reported **failed** in `cypress run` (exit code 1) but **passed** in `cypress open` |

I didn’t check the two failed-test `afterEach` variants in `cypress open`.

### 6. Duplicate search — **done**

I searched `is:issue` for `"Cypress.stop"`, `"test was stopped while running this command"`, and `Cypress.stop` combined with beforeEach, afterEach, skipped and passed.

- **#33465** “option for `Cypress.stop` to not fail the test” is the closest. It has the same error and the same root cause, called inside a test via `cy.then`. It was closed on 2026-04-15 as a feature request that’s out of scope, and the reporter asked afterward whether the old behavior could come back. It isn’t a bug report on reporting consistency, so the draft links it instead of duplicating it. Reopening it as a bug would also work.
- #29889: the same error text, but from an async `before` hook running past 4 s. Related symptom, different cause.
- #31781 / #31830: the change that exposed this.
- #31280: open-mode counter counts after a rerun. Unrelated as far as I can tell.
- #31331 (open): a request to make `Cypress.stop()` a config setting. Unrelated.

### 7. Issue draft — see [`ISSUE.md`](./ISSUE.md)

The repo’s bug template has fields for Current behavior, Desired behavior, Test code to reproduce, Cypress Version, Debug Logs and Other. It has no Browser or OS field, so I added those as their own headings.

## What I did not verify

- The released 16.3.0 binary. I tested `develop` built from source.
- Versions before 14.5.0 (the “used to pass” claim comes from #33465).
- Chrome, Firefox and WebKit. I tested Electron only.
- macOS and Windows.
- The open-mode mechanism. Failure appearing at about 4 s fits the same runnable timer, but I didn’t instrument it.
- `afterEach` after a failed test in `cypress open`.
- Calling `Cypress.stop()` directly inside a test body with a command queued (#33465’s case). I only read about that one.
- Whether the proposed fix works. It’s a sketch, and nothing is implemented.
- No `DEBUG` logs were captured, so the template’s Debug Logs field says N/A.
