# cypress-cucumber-preprocessor performance benchmark

Preprocessor: @badeball/cypress-cucumber-preprocessor (built from source clone)
Workload: 30 features x 5 scenarios x 5 steps
Global step universe: 20 files x 10 steps = 200 step definitions
Node v22.22.2

## A. Per-spec bundling time + output size (mirrors one-bundle-per-spec)

| bundler | step-defs | features | total time | per-feature | per-feature bundle |
|---|---|---:|---:|---:|---:|
| esbuild | global | 30 | 1580 ms | 53 ms | 751.4 KiB |
| esbuild | scoped | 30 | 1424 ms | 47 ms | 733.6 KiB |
| webpack | global | 6 | 2652 ms | 442 ms | 851.4 KiB |
| webpack | scoped | 6 | 1815 ms | 302 ms | 829.2 KiB |

- esbuild vs webpack (global, per-feature): **8.4x faster** with esbuild
- global vs scoped (esbuild, per-feature time): **1.1x**; bundle size **1.0x** smaller when scoped

## B. Step-definition glob discovery — memoization (improvement #4)

| variant | calls (1/feature) | total time |
|---|---:|---:|
| baseline (re-glob per feature) | 30 | 15 ms |
| memoized (cache per pattern) | 30 | 0.66 ms |

- **22.4x faster** glob discovery across the run (global patterns are identical per feature).

## C. Registry step matching — text cache (improvement #2)

| variant | step-defs | step occurrences | total time |
|---|---:|---:|---:|
| baseline (linear scan + re-match) | 200 | 1500 | 28 ms |
| cached (memo by step text) | 200 | 1500 | 0.11 ms |

- **247.9x faster** step matching. Baseline cost scales with (occurrences x step-def count); also incurred a 2nd time eagerly at load (pickleStepToTestStep).

## D. Generated-module / inlined-payload size (#908)

| metric | value |
|---|---:|
| avg generated module / feature | 15.5 KiB |
| max generated module / feature | 15.5 KiB |
| total across 30 features | 464.9 KiB |

> The gherkinDocument + pickles + raw source are JSON-inlined into every feature bundle and re-serialized to the browser/Cloud. Grows with scenarios/feature; was the cause of >22 MiB payloads in #908.
