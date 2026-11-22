# `Cypress.stop()` reports the test it’s called in as passed or failed, depending on whether a command was queued first

<!-- Draft for cypress-io/cypress, following .github/ISSUE_TEMPLATE/1-bug-report.yml. Not filed. -->

### Current behavior

When `Cypress.stop()` is called from a hook, the remaining tests in the spec are reported as skipped, as the [docs](https://on.cypress.io/cypress-stop) describe. The test that was running when the stop happened is reported inconsistently. Its result depends only on whether a Cypress command was queued just before the call:

| Where `Cypress.stop()` is called | Command queued first? | `cypress run` | `cypress open` |
| --- | --- | --- | --- |
| `beforeEach` | yes (`cy.log()`) | **failed** after `defaultCommandTimeout` (4 s), exit code 1, failure screenshot | **failed** about 4 s later, with no error message and “No commands were issued in this test.” |
| `beforeEach` | no | **passed**, `(NaNms)`, test body never ran, exit code 0 | **passed**, test body never ran |
| `afterEach`, after a passing test | yes | the passing test is reported **failed**, exit code 1 | the passing test is reported **passed** |
| `afterEach`, after a failing test (the docs pattern) | no | failed for its real reason, the rest skipped, exit code 1 | not checked |
| `afterEach`, after a failing test | yes | failed, plus a second failure for the `after each` hook, and the run takes 8 s instead of 4 s | not checked |

The failure in `cypress run` reads:

```
  1) Environment
       "before each" hook for "first":
     CypressError: Cypress test was stopped while running this command.
Because this error occurred during a `before each` hook we are skipping all of the remaining tests.
```

None of these results tells the reader that the run was stopped on purpose. A few of them are actively misleading:

- The docs’ own [“Abort tests when a condition is met”](https://docs.cypress.io/api/cypress-api/stop#Abort-tests-when-a-condition-is-met) example calls `cy.log()` and then `Cypress.stop()` in a `beforeEach`. Followed as written, it turns an intentional stop into a failed run with a confusing error.
- In the no-command case, a test whose body never ran is reported as passed. Its body throws synchronously and it’s still `✓ first (NaNms)`.
- The run waits for the full `defaultCommandTimeout` before it reports the failure, so a suite with a long timeout hangs for that long.
- The same spec gets a different verdict in `cypress open` than in `cypress run`.

#### Why a queued command flips the result

Links point to `develop` at `d5fd0e6`.

`Cypress.stop()` ([`cypress.ts#L942-L952`](https://github.com/cypress-io/cypress/blob/d5fd0e6af916a08c506ff4d0cf6e9d7ddc5c4660/packages/driver/src/cypress.ts#L942-L952)) calls `runner.stop()` and then `cy.stop()`.

1. `runner.stop()` sets `_runner.stopped` and aborts right away only in interactive mode ([`runner.ts#L2006-L2018`](https://github.com/cypress-io/cypress/blob/d5fd0e6af916a08c506ff4d0cf6e9d7ddc5c4660/packages/driver/src/cypress/runner.ts#L2006-L2018)). In `cypress run`, the abort waits until the current test’s `test:after:run` events have fired ([`runner.ts#L556-L561`](https://github.com/cypress-io/cypress/blob/d5fd0e6af916a08c506ff4d0cf6e9d7ddc5c4660/packages/driver/src/cypress/runner.ts#L556-L561)). That ordering came from #31830 (14.5.0), which fixed #31781.
2. `cy.stop()` calls `doneEarly()`, which calls `queue.endEarly({ canceled: true })` ([`cy.ts#L646-L653`](https://github.com/cypress-io/cypress/blob/d5fd0e6af916a08c506ff4d0cf6e9d7ddc5c4660/packages/driver/src/cypress/cy.ts#L646-L653), [`cy.ts#L1418-L1420`](https://github.com/cypress-io/cypress/blob/d5fd0e6af916a08c506ff4d0cf6e9d7ddc5c4660/packages/driver/src/cypress/cy.ts#L1418-L1420)).

**With a command queued:** the first `cy.*` call starts the queue and stores its promise in `state('promise')` ([`cy.ts#L886-L890`](https://github.com/cypress-io/cypress/blob/d5fd0e6af916a08c506ff4d0cf6e9d7ddc5c4660/packages/driver/src/cypress/cy.ts#L886-L890)). The hook returns that promise to mocha ([`cy.ts#L1105-L1115`](https://github.com/cypress-io/cypress/blob/d5fd0e6af916a08c506ff4d0cf6e9d7ddc5c4660/packages/driver/src/cypress/cy.ts#L1105-L1115)). `endEarly` sees a pending promise, so it does two things ([`command_queue.ts#L240-L260`](https://github.com/cypress-io/cypress/blob/d5fd0e6af916a08c506ff4d0cf6e9d7ddc5c4660/packages/driver/src/cypress/command_queue.ts#L240-L260)):

- It calls `cleanup({ resetTimeout: true })`, which re-arms the runnable’s timer ([`command_queue.ts#L208-L214`](https://github.com/cypress-io/cypress/blob/d5fd0e6af916a08c506ff4d0cf6e9d7ddc5c4660/packages/driver/src/cypress/command_queue.ts#L208-L214)). The timeout is `defaultCommandTimeout` ([`cy.ts#L1002-L1007`](https://github.com/cypress-io/cypress/blob/d5fd0e6af916a08c506ff4d0cf6e9d7ddc5c4660/packages/driver/src/cypress/cy.ts#L1002-L1007)).
- It cancels the promise the hook returned, and a cancelled Bluebird promise never settles.

The only thing left to finish the hook is that timer. When it fires, `patchRunnableResetTimeout` fails the hook with `miscellaneous.test_stopped` ([`mocha.ts#L584-L614`](https://github.com/cypress-io/cypress/blob/d5fd0e6af916a08c506ff4d0cf6e9d7ddc5c4660/packages/driver/src/cypress/mocha.ts#L584-L614), [`error_messages.ts#L997`](https://github.com/cypress-io/cypress/blob/d5fd0e6af916a08c506ff4d0cf6e9d7ddc5c4660/packages/driver/src/cypress/error_messages.ts#L997)). In `cypress run`, the deferred abort can’t happen until that runnable finishes, so the error is reported against the hook and the test fails. In `cypress open`, the run is already aborted, but the timer still fires and marks the test failed without an error.

**With no command queued:** there’s no pending promise, so nothing is cancelled. The hook returns synchronously and mocha completes it normally. Every later runnable then goes through `onRunnableRun`, which returns `_next()` with no error once `_runner.stopped` is set ([`runner.ts#L1673-L1675`](https://github.com/cypress-io/cypress/blob/d5fd0e6af916a08c506ff4d0cf6e9d7ddc5c4660/packages/driver/src/cypress/runner.ts#L1673-L1675)). For the current test, mocha treats a callback with no error as a pass. So the test is reported as passed without its body running, and with no start time, hence `NaNms`.

### Desired behavior

`Cypress.stop()` should report the current test the same way whether or not a command was queued first, in both `cypress open` and `cypress run`. Concretely:

- A test that hadn’t finished when `Cypress.stop()` was called (stop from `before`, `beforeEach` or the test body) is reported as **skipped**, like the remaining tests. It isn’t reported as passed, because its body didn’t run. It isn’t reported as failed, because nothing failed.
- A test that already has a result (stop from `afterEach`) keeps that result. A test that passed stays passed, and a test that failed stays failed with its original error and no extra `after each` failure.
- Stopping doesn’t fail the run by itself. The exit code reflects real failures only, which matches `expectedExitCode: 0` in the existing `system-tests/test/cypress-stop.spec.ts`.
- Nothing waits for `defaultCommandTimeout`, and no `Cypress test was stopped while running this command` error is shown for an intentional stop.

### Test code to reproduce

`cypress.config.js`:

```js
module.exports = {
  retries: 0,
  e2e: { supportFile: false },
}
```

**Spec A**, with a command queued before the stop (reported as failed):

```js
beforeEach(() => {
  cy.log('Stopping the run')
  Cypress.stop()
  return
})

describe('Environment', () => {
  it('first', () => {
    cy.wrap(1).should('eq', 1)
  })
  it('second', () => {
    cy.wrap(2).should('eq', 2)
  })
})
```

**Spec B**, the same spec without the `cy.log()` line (reported as passed). To see that the body never runs, swap `first` for this one: it’s still reported `✓ first (NaNms)`.

```js
it('first', () => {
  throw new Error('the body of first ran')
})
```

**Spec C**, stopping in `afterEach` after a passing test, with a command queued. It reports a passing test as failed in `cypress run` and as passed in `cypress open`.

```js
afterEach(function () {
  cy.log('Stopping after a pass')
  Cypress.stop()
  return
})

describe('Environment', () => {
  it('first passes', () => {
    cy.wrap(1).should('eq', 1)
  })
  it('second', () => {
    cy.wrap(2).should('eq', 2)
  })
})
```

Run each spec with `cypress run --browser electron --spec <spec>`, then open it with `cypress open`.

### Cypress Version

16.3.0, and `develop` at `d5fd0e6`. #33465 reports that 14.4.1 passed and 14.5.0 and later fail, which lines up with #31830 deferring the run-mode abort.

### Browser

Electron (bundled), headless in `cypress run` and headed in `cypress open`. Chrome and Firefox not checked.

### Operating System

Ubuntu 24.04 (x86_64)

### Debug Logs

```shell
N/A — the cause is traced to driver code above.
```

### Other

**Related issues:**

- #33465 reports the same `test was stopped while running this command` failure from `cy.then(() => Cypress.stop())` in a test body. It was closed as a feature request (“option for `Cypress.stop` to not fail the test”). I think the root cause is the bug described here rather than a missing option.
- #31781 / #31830 moved the run-mode abort to after `test:after:run`, which exposed the hanging runnable.
- #29889 shows the same error text from a different cause (an async `before` hook running past the 4 s runnable timeout).

**Possible fix (sketch):**

1. **Settle the current runnable instead of leaving it on a cancelled promise.** When the cancel comes from `Cypress.stop()`, `endEarly` shouldn’t re-arm the runnable timer (`cleanup({ resetTimeout: canceled })` at `command_queue.ts#L247`). It should clear the timer and complete the runnable through its mocha callback. Stop needs its own path here: `canceled: true` is shared with ordinary run cancellation (`cy:canceled`), whose behavior should stay as it is. The `test:after:run:async` ordering from #31830 has to be preserved so Test Replay still gets its events.
2. **Don’t report a test that never ran as passed.** In `onRunnableRun` (`runner.ts#L1673`), when `_runner.stopped` is set and the runnable is a test with no result yet, mark it skipped instead of calling `_next()` with no error. Hooks without a test can keep the current early return.
3. **Apply the same handling in both modes,** so the open-mode abort doesn’t leave a timer that later marks the test failed.

**Tests that would cover it:**

- **System test:** extend `system-tests/projects/cypress-stop` with fixtures that queue a command (`cy.log()`) before `Cypress.stop()` in `beforeEach`, in a test body, and in `afterEach` after both a passing and a failing test. Set a long `defaultCommandTimeout` (for example `60000`) in those fixtures so a hang shows up as a test timeout instead of a 4 s blip. Assert:
  - exit code 0 when nothing really failed
  - no `test was stopped while running this command` in stdout
  - the stopped test shown as skipped in the snapshot

  The existing `before` and `beforeEach` snapshots record `✓ should not run this test (NaNms)` and would need updating.
- **Driver unit test:** in `packages/driver/test/unit/cypress/command_queue_cancel.spec.ts`, add a stop case asserting that the runnable timer isn’t re-armed and the runnable settles. The current `when the run is canceled` case asserts `resetTimeout` *is* called (line 154), so the stop and cancel paths would need separate cases.
- **Open mode:** a reporter check that the stopped test isn’t shown as failed a few seconds after the stop. I haven’t confirmed which open-mode harness fits best.
