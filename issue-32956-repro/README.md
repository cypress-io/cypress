# Reproduction — #32956 "Mocha runner hangs between tests"

This project reproduces the scenario behind
[cypress-io/cypress#32956](https://github.com/cypress-io/cypress/issues/32956):
in Chrome/Electron, opening a new tab or popup (`window.open`, `target="_blank"`)
creates an extra browser "target" that Cypress attaches to in a **paused** state
(`waitForDebuggerOnStart`). The runner only resumes that target after it connects
to it over CDP. If that connection ever hangs, the target is never resumed and the
run hangs in the transition between tests — with no error and no timeout.

## What's here

- `cypress.config.js` — starts a tiny static server (port 9988) serving an
  "opener" page and a "popup" page. No `require('cypress')`, so it also runs
  against a Cypress monorepo dev build.
- `cypress/e2e/popup_between_tests.cy.js` — 10 tests, each opens a popup.

## Important: the real-world hang is a race

The end-to-end hang depends on the popup target's CDP connection stalling at just
the right moment relative to the between-test transition. It is **timing
dependent** (that's why issue reporters can't pin it to a specific test, and why
it shows up sporadically in CI under load). Running this project once will usually
pass. To observe a natural hang you generally need to run it many times, under
load, on an affected version:

```bash
# affected versions: e.g. 13.17.0, 15.16.0 (anything before the fix)
npm i -D cypress@15.16.0

# loop it; on an affected version this will eventually hang (Ctrl-C to stop)
for i in $(seq 1 50); do
  echo "run #$i"
  npx cypress run --browser chrome --spec cypress/e2e/popup_between_tests.cy.js || break
done
```

## Deterministic proof of the fix (recommended)

Because the race is hard to trigger on demand, the **deterministic** proof lives
in a unit test that simulates the exact failure condition — an extra-target CDP
connection that never resolves — and asserts the target is still resumed.

From a clone of the Cypress monorepo:

```bash
# on the FIXED branch (claude/cypress-issue-32956-3FNQq): all pass
yarn workspace @packages/server test-unit -- \
  browsers/browser-cri-client_spec.ts --grep "_onAttachToTarget"
#  => 42 passing, including:
#     ✓ sends Runtime.runIfWaitingForDebugger if connecting to the target hangs ... (#32956)
#     ✓ closes the extra target connection if it resolves after the connect timeout ... (#32956)
```

To see the **pre-fix** behavior, revert the bounded connect in
`packages/server/lib/browsers/browser-cri-client.ts` back to an unbounded await:

```diff
- extraTargetCriClient = await Bluebird.resolve(connectToExtraTarget).timeout(getConnectToExtraTargetTimeout())
+ extraTargetCriClient = await connectToExtraTarget
```

and re-run the same test. The `#32956` test now **hangs and fails**:

```
1) ... sends Runtime.runIfWaitingForDebugger if connecting to the target hangs ... (#32956):
   Error: Timeout of 10000ms exceeded. ...
2 failing
```

That timeout = the runner waiting forever on the paused target. The fix bounds the
connection (default 20s, override with `CYPRESS_CONNECT_TO_EXTRA_TARGET_TIMEOUT`)
and always resumes the target, so the run continues.

## System-level guard

A system test that drives the real extra-target attach/connect/teardown cycle
across the between-test transition is included in the fix branch:

```bash
cd system-tests
BROWSER=chrome node ./scripts/run.js --glob-in-dir="test" extra_target_window_open_spec
```
