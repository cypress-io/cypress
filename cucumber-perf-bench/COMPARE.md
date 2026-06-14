# Before/after: pristine vs patched preprocessor (real source)

Workload: 40 features x 8 scenarios x 6 steps; 480 global step definitions; Node v22.22.2

| path | metric | baseline | patched | speedup |
|---|---|---:|---:|---:|
| #4 glob memo | 40 discovery calls | 47 ms | 7.55 ms | 6.3x |
| #4 (via compile) | compile 40 features | 212 ms | 154 ms | 1.4x |
| #2 match cache | resolve 1920 steps (480 defs) | 78 ms | 5.89 ms | 13.3x |
| #1 lazy matching | createTests load, tracking off | 21 ms | 8.39 ms | 2.5x |

> #3 (step-hook fast path) eliminates per-step filter/sort/reverse when no step hooks are defined; it affects the in-test execution loop and is not exercised by these load/bundle benchmarks.