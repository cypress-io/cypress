# Writing performant regular expressions

A regex that looks harmless on a 60-character stack line can stall the process on a 50,000-character one. JavaScript's regex engine backtracks, so a pattern with overlapping quantifiers can take quadratic or exponential time on input that *almost* matches. When that code runs in the server or the driver, a test run hangs. Lint rules catch some of these shapes, but they can't know how big the input really gets or how often the line runs.

So before you add or change a regex, measure it. This guide walks through the steps, and [`scripts/check-regex.js`](../scripts/check-regex.js) runs the measuring part for you.

- [1. Know your input](#1-know-your-input)
- [2. Run a static check](#2-run-a-static-check)
- [3. Time it](#3-time-it)
- [4. Prefer safe shapes](#4-prefer-safe-shapes)
- [5. Add a regression test](#5-add-a-regression-test)
- [Worked examples](#worked-examples)

## 1. Know your input

Write down three things before you look at the pattern. They belong in the PR description too, so a reviewer can follow your reasoning.

- **Where the input comes from.** Is it untrusted traffic from the application under test (response bodies, headers, cookies), user test data (assertion values, fixtures, spec source), or trusted tool output (`ps`, `git`, a browser's stack trace)? Every one of these can get large, and only trusted tool output has a shape you can count on.
- **Its realistic maximum size.** Stack lines carry long paths and bundled URLs, `ps eww` lines in CI carry the whole environment and run to tens of KB, and stubbed bodies are as big as the user's fixture.
- **How often the code runs.** Once per run, once per command, once per stderr line or once per proxied request? A hot path makes a slow regex expensive even when it never blows up.

## 2. Run a static check

[`recheck`](https://makenowjust-labs.github.io/recheck/) analyses a pattern and reports `safe`, `vulnerable` or `unknown`, along with its complexity and a worst-case input (which `recheck` calls an attack string). It's a root devDependency, so a root `yarn` install is all you need. Pass the script the regex literal, in single quotes so the shell leaves it alone:

```bash
yarn check-regex '/^\s+\S[^\s:]*:/u'
```

The result should be `safe`. If `recheck` says `vulnerable` and you're keeping the pattern, the PR has to say why that's acceptable. Two justifications hold up:

- The input is bounded before it gets here, and you can point to the bound, such as a `slice` or a length check just above, or a format that can't exceed a known size.
- The timings in step 3 stay flat up to that bound.

"The input is usually short" isn't a justification. Most of the fixes listed below began as exactly that assumption.

If `recheck` reports `unknown` (for example, its analysis timed out), treat it like `vulnerable`: rely on the step 3 timings and explain them.

## 3. Time it

Static analysis says whether a pattern *can* blow up. Timing tells you whether it does at the sizes your input really reaches. The script handles both halves:

- **Real inputs at realistic size.** Pass captured output with `--samples <file>` (one input per line, or a JSON array in a `.json` file for inputs that span lines). Capture it from the real tool or browser. Don't hand-write lines that only look plausible.
- **The worst case.** When `recheck` finds a worst-case input, the script grows it to 1,000, 10,000 and 50,000 characters. To time a rewrite against the pattern it replaces, pass the old pattern with `--worst-case-from`.

Each run happens in a worker thread that the main thread stops after 2,000 milliseconds. That matters: a runaway regex blocks the thread it runs on, so a `setTimeout` in the same thread doesn't fire until the regex returns. A row whose time reads `> 2000` means the regex was still running when the cap hit.

Read the timings as relative, not absolute. They come from one machine, so compare rows against each other rather than with numbers measured somewhere else. The thing to look for is growth. Each run has a fixed overhead of a fraction of a millisecond, so judge growth once the times are well above that. Going from 1,000 to 10,000 characters, a linear regex takes roughly ten times as long, a quadratic one roughly a hundred times, and an exponential one never comes back.

The script exits `1` when `recheck` doesn't rate a pattern `safe` or a run hits the cap.

## 4. Prefer safe shapes

Most fixes come from a short list of rewrites:

- **Use a negated class instead of `.*?` before a literal.** `[^)]*\)` can't run past the `)` it's looking for, but `.*?\)` can.
- **Anchor where you can.** An unanchored pattern is retried from every start position, which turns a linear scan into a quadratic one when the match fails.
- **Avoid nested or overlapping quantifiers.** `(\S+:)+`, `(a|a)*`, and adjacent runs that can match the same characters, such as `\s*.*` or `\d+\d*`, all give the engine many ways to split the same input.
- **Don't end with an unanchored `\s+$` or `\d+$`.** Each start position inside a long run of spaces or digits scans to the end and fails. Use `trimEnd()`, or walk back from the end of the string.
- **Use string methods where a regex isn't needed.** `indexOf`, `lastIndexOf`, `startsWith`, `endsWith`, `split` and `trimEnd` are linear and easier to read. Several fixes below keep only a short anchored regex and find the rest with `lastIndexOf`.
- **Escape user input before passing it to `new RegExp`.** `_.escapeRegExp(value)` stops a value that contains regex syntax from changing the pattern.
- **Hoist regexes to module scope.** The regex is then built once rather than on every call, which matters most for one built with `new RegExp`. Watch out with the `g` or `y` flag, though: `test` and `exec` keep `lastIndex` between calls, so a hoisted global regex carries state from one input to the next. Drop the flag if you only test each input once.
- **Check the browser floor for newer syntax in driver code.** Lookbehind (`(?<=…)`, `(?<!…)`), named groups and the `v` flag have to work on every browser in [`browser-bundles.browserslistrc`](../browser-bundles.browserslistrc). See [Runtime targets](../AGENTS.md#runtime-targets). ESLint's `compat/compat` rule checks APIs, not regex syntax, so you'll need to check this by hand.

A rewrite has to accept the same inputs as the original, too. Check it against the existing tests and against the real samples from step 3. If the regex is only part of a function, compare the function, not just the pattern.

## 5. Add a regression test

Pin the fix with a test that feeds in a 50,000-character worst-case input, usually the one from step 3, and asserts a time bound that's generous enough to pass on a slow CI machine but well below what the old pattern took. This one comes from [`packages/stderr-filtering/lib/__spec__/constants.spec.ts`](../packages/stderr-filtering/lib/__spec__/constants.spec.ts):

```ts
it.each(cases)('handles %s in linear time', (_name, input, expected) => {
  const start = performance.now()

  expect(DEBUG_PREFIX.test(input)).toBe(expected)
  expect(performance.now() - start).toBeLessThan(200)
})
```

Keep the cases that check what the regex *matches* separate from the timing cases, and take them from real captured output.

## Worked examples

These come from merged fixes. Each "Before" result was measured with `yarn check-regex` on one machine. Every regex left in the rewrites comes back `safe`.

- **Stack line location, `parseStackLine`** ([#35368](https://github.com/cypress-io/cypress/pull/35368))
  - Before: `/^\s*(?:at )?.*@?\((.*?):(\d+):(\d+)\)?$/`, a 3rd-degree polynomial. It hit the time cap from 10,000 characters.
  - After: `/:(\d+):(\d+)\)?$/`, plus `lastIndexOf('(')` for the path.
- **Debug-output prefix, `DEBUG_PREFIX`** ([#35495](https://github.com/cypress-io/cypress/pull/35495))
  - Before: `/^\s+((\u001b\[\d+(;\d+)*m)*(\S+):)+/u`, a 2nd-degree polynomial. It took more than 1,000 times longer at 50,000 characters than at 1,000.
  - After: `/^\s+\S[^\s:]*:/u`.
- **Stack line test, `stackLineRegex`** ([#35343](https://github.com/cypress-io/cypress/pull/35343))
  - Before: `/^\s*(at )?.*@?(?:\(?.*(?::\d+:\d+|<unknown>|\[native code\])+\)?)$/`, a 4th-degree polynomial. It hit the time cap from 1,000 characters.
  - After: `/(?::\d+:\d+|<unknown>|\[native code\])\)?$/`.
- **WebKit stack normalisation** ([#35343](https://github.com/cypress-io/cypress/pull/35343))
  - Before: `/(.*)@(.*)(\n?)/g`, a 2nd-degree polynomial.
  - After: `split('\n')` and `lastIndexOf('@')`.
- **`CYPRESS_API_URL` from `ps eww`** ([#35372](https://github.com/cypress-io/cypress/pull/35372))
  - Before: `/(\d+)\s.*CYPRESS_API_URL=(\S+)\s/`, a 3rd-degree polynomial.
  - After: `/^(\d+)\s/`, plus `lastIndexOf` for the key.
- **Stubbed-response HTML sniffing** ([#35360](https://github.com/cypress-io/cypress/pull/35360))
  - Before: `/<.+>[\s\S]+<\/.+>/`, a 4th-degree polynomial. It hit the time cap from 1,000 characters.
  - After: a single forward scan, no regex.

Here's the first example as the script shows it. `node-stack-lines.txt` holds the `at` lines of a real Node stack trace.

```bash
yarn check-regex '/:(\d+):(\d+)\)?$/' --samples node-stack-lines.txt --worst-case-from '/^\s*(?:at )?.*@?\((.*?):(\d+):(\d+)\)?$/'
```

The rewrite stays flat on the old pattern's worst-case input at every size. One sample, `at [eval]:1:7`, matches the rewrite and not the original, because `parseStackLine` now rejects that line with its `lastIndexOf('(')` check instead. It's a good reminder to compare the whole function, not just the pattern.
