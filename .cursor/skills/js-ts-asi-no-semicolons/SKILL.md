---
name: js-ts-asi-no-semicolons
description: >-
  Avoids Automatic Semicolon Insertion (ASI) bugs when the next line starts with
  `[`, `(`, or other continuation tokens in no-semicolon JS/TS (Cypress repo style).
  Prefer `for...of` over `;[...].forEach` at statement boundaries. Use when writing or
  reviewing tests/specs, Vitest/Mocha suites, or any file that omits semicolons.
---

# ASI and no-semicolon style (`[` / `(` at line start)

[Cypress AGENTS.md](../../../AGENTS.md) enforces **no semicolons**. Without an explicit `;`, JavaScript inserts semicolons at line breaks only where the grammar allows it. A line that **starts with `[` or `(`** can be parsed as **continuing the previous expression**, not as a new statement.

## Hazardous pattern

```javascript
  })   // end of previous statement (e.g. closing `it`, `describe`, object, etc.)

  ['a', 'b'].forEach((x) => {
    it(...)
  })
```

The parser treats this as something like `})['a', 'b']` (comma operator + member access), **not** as an array literal followed by `.forEach`. Behavior ranges from syntax errors to subtle runtime bugs; in Vitest/Mocha it can **hang or deadlock** while loading the file.

Same class of issue for lines starting with `(`, `` ` ``, unary `+`/`-`, regexp literals, etc.

## Preferred fix (this repo)

Rewrite array-driven test generation so the next line does **not** begin with `[`:

```javascript
for (const override of ['', 'false', '0']) {
  it(`example ${override}`, () => {
    // ...
  })
}
```

This matches existing patterns, needs no leading `;`, and reads clearly.

## Alternative fix

If you must keep `.forEach` on a literal array, **prefix the line with `;`** so the statement cannot attach to the previous one:

```javascript
  ;['a', 'b'].forEach((x) => { ... })
```

Use sparingly—easy to forget in review.

## When to apply

- New or migrated **`test/unit/**/*.spec.ts`**, **`*_spec.js`**, or any **`lib/**/*.ts`** without semicolons.
- After `})`, `]`, or other closers that end a statement: if the **next** line starts with `[` or `(`, pause and fix.

## Related

- [server-unit-js-spec-to-ts-vitest](../server-unit-js-spec-to-ts-vitest/SKILL.md) — Vitest migration patterns for `@packages/server` unit tests.
