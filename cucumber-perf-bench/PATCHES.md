# Preprocessor performance patches

Four patches applied to `@badeball/cypress-cucumber-preprocessor` (clone ref
`6b4d2a5`, v24.0.1) and verified against the rebuilt source. The full diff is in
[`preprocessor-perf.patch`](./preprocessor-perf.patch); apply with:

```bash
cd preprocessor-src && git apply ../preprocessor-perf.patch && npm run build
```

All 421 unit tests still pass (`npm run test:unit`), lint and type-check are
clean. The two browser-runtime-only effects (#1 tracking-on path, #3) are
preserved byte-for-byte and require a browser run to exercise the report path.

## Measured before/after (`node compare.js`)

Workload: 40 features × 8 scenarios × 6 steps; 480 global step definitions; Node 22.

| Patch | Metric | Baseline | Patched | Speedup |
|---|---|---:|---:|---:|
| #4 glob memo | 40 step-def discovery calls | 47 ms | 7.6 ms | **6.3x** |
| #4 (through compile) | compile 40 features | 212 ms | 154 ms | **1.4x** |
| #2 match cache | resolve 1920 steps (480 defs) | 78 ms | 5.9 ms | **13.3x** |
| #1 lazy matching | `createTests` load, tracking off | 21 ms | 8.4 ms | **2.5x** |

## The patches

### #4 — Memoize step-definition glob discovery (`lib/step-definitions.ts`)
`getStepDefinitionPaths` is called once per feature during bundling. With a
global pattern the identical glob is re-run for every feature. The patch
memoizes the result Promise by `(projectRoot + patterns)` for the process
lifetime, collapsing N globs to one per distinct pattern set.
*Trade-off:* a process-lifetime cache assumes the step-def file set is stable
during a run (already true — editing step defs in `open` mode requires a
restart, see upstream issue #1).

### #2 — Cache step matching by text (`lib/registry.ts`)
`getMatchingStepDefinitions` does an `O(stepDefinitions)` scan (running
`expression.match` on each) for every step — incurred both eagerly at load and
again at run time. The patch memoizes the matching list per step text. Safe
because `stepDefinitions` are immutable after `finalize()` and a `Registry`
instance is scoped to a single spec.

### #1 — Skip eager matching when state tracking is off (`lib/browser-runtime.ts`)
`pickleStepToTestStep` matched every pickle step at spec load purely to populate
report envelopes (`stepDefinitionIds` / `stepMatchArgumentsLists`), which are
only consumed when `isTrackingState` is true. The patch skips the matching pass
when tracking is off. The test-step id is still generated, so the execution path
(and `getTestStepId`) is unaffected; the tracking-on branch is unchanged.

### #3 — Fast path for empty step hooks (`lib/registry.ts`)
`resolveStepHooks` runs a filter + sort (+ reverse) for every step, twice
(before/after) — even when no `BeforeStep`/`AfterStep` hooks exist (the common
case). The patch returns early when `stepHooks` is empty. This affects the
in-test execution loop and is not exercised by the load/bundle benchmarks above.
