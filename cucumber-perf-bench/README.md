# cypress-cucumber-preprocessor — performance benchmark harness

A minimal, reproducible harness that benchmarks the performance-sensitive code
paths of [`@badeball/cypress-cucumber-preprocessor`](https://github.com/badeball/cypress-cucumber-preprocessor)
and **verifies** candidate improvements against the *real* built source — no
browser, display, or Cypress binary required (all measured paths are
deterministic Node code).

## What it measures

| # | Benchmark | Code path | Improvement verified |
|---|---|---|---|
| A | Per-spec bundling time + bundle size — esbuild vs webpack, global vs scoped step defs | `compile()` + bundler, once per spec (mirrors Cypress's one-bundle-per-spec model) | The two *already-available* mitigations: prefer esbuild; scope step definitions |
| B | Step-definition glob discovery | `getStepDefinitionPaths()` (re-globbed per feature, no memoization) | #4 memoize glob by pattern |
| C | Registry step matching | `Registry.resolveStepDefinition` / `getMatchingStepDefinitions` (linear scan + re-`match`, incurred at load *and* run time) | #2 cache matching by step text |
| D | Generated-module / inlined-payload size | `compile()` output (gherkinDocument + pickles + source JSON-inlined per spec) | Characterizes #908 payload bloat |

B and C run a **baseline vs. improved** variant side by side so the speedup is
measured directly. A and D establish baselines and quantify the config-level
levers.

## Setup & run

```bash
./setup.sh          # clones + builds the preprocessor, installs esbuild/webpack
npm run bench       # runs all benchmarks, prints a report, writes RESULTS.md
```

Tunables (env vars, with defaults):

```
FEATURES=30 SCENARIOS=5 STEPS=5 STEPDEF_FILES=20 STEPS_PER_FILE=10 \
WEBPACK_SUBSET=6 PREPROCESSOR_REF=master npm run bench
```

`PREPROCESSOR_SRC` overrides the location of the built preprocessor clone.

## How the workload is generated

`lib/generate.js` writes a synthetic Cypress project in two step-definition
layouts from the same feature set:

- **global** — one shared pool of step-def files matched by a global glob; every
  feature bundle `require()`s all of them (the default worst-case fan-out).
- **scoped** — one co-located step-def file per feature matched by `[filepath]`;
  every feature bundle requires only its own steps.

## Notes / fidelity

- Benchmarks A and D drive the **real** `compile()` and the real esbuild/webpack
  entrypoints from the built clone.
- Benchmark C uses the **real** `Registry` and `@cucumber/cucumber-expressions`
  matching; the registry's inline-source-map lookup (a browser `XMLHttpRequest`)
  is stubbed to fail gracefully in Node, which does not affect matching cost.
- See `RESULTS.md` for a captured baseline run.

## Selected findings (captured runs, Node 22, this container)

- **esbuild is ~8x faster than webpack** per spec (bundling dominates the
  per-spec cost). This is the single biggest, already-available lever.
- **Scoping step definitions** (`[filepath]`) reduces per-spec bundle time;
  the gap scales with the size of the global step-def pool. At ~200 defs the
  effect is small (the constant runtime weight dominates); at ~960 defs it is
  ~1.4x on esbuild and **~1.75x on webpack**.
- **Glob memoization (#4):** ~20-30x faster step-def discovery across a run,
  because global patterns are identical for every feature.
- **Registry match cache (#2):** matching is effectively eliminated
  (hundreds-x) once cached by step text; the baseline cost scales with
  occurrences x step-def count and is paid twice today (load + run).
- **Payload (#908):** the full gherkinDocument + pickles + raw source are
  JSON-inlined into every feature module (~15 KiB/feature here) and grow with
  scenarios per feature.
