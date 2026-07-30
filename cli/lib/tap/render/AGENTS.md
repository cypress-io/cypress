# Tap render — CLI output conventions

This directory turns each `cypress tap <command>`'s structured result into the
human-readable output printed in the terminal. The goal: the CLI reads as the
**same tool** as the Cypress app — same palette, same state icons, same shape —
so someone who knows the reporter panel recognizes the terminal output instantly.

## Principles

- **`--json` is the contract; the human rendering is a view.** The structured
  result a command returns is the source of truth and is always available via
  `--json`. A renderer only reshapes it for reading — never add information the
  JSON doesn't carry, and keep machine-facing fields (absolute timestamps, ids,
  ports) in the JSON even when the human view abbreviates or omits them.
- **Compose from the shared vocabulary, don't hand-roll.** Every renderer builds
  its output from the primitives in [`format.ts`](./format.ts) and hands blocks
  to `layout`. If you find yourself writing raw padding, `\n` joins, or `chalk`
  calls in a `renderX.ts`, the primitive you need probably already exists (or
  belongs in `format.ts` so the next command can share it).
- **Match the reporter's palette.** Colors in `format.ts` are pulled from the
  reporter's SCSS variables so the two surfaces agree by construction. Reach for
  a named `color.*` / `stateBadge`, never a fresh hex.

## The shared vocabulary (`format.ts`)

- `layout(blocks)` — assembles `string[][]` blocks into the final string: lines
  within a block on their own rows, blocks separated by a blank line, trailing
  whitespace trimmed. Every renderer ends by returning `layout([...])`.
- `heading(title, count?)` — a dim panel title, optionally carrying its row
  count: `SPECS (26)`, `ROUTES (2)`.
- `table` / `definitionList` — aligned columns and `label  value` rows. They
  **pad before coloring** so ANSI escape codes never count toward column width;
  keep that invariant if you extend them.
- `titleLine`, `countsLine`, `stateBadge` — the reporter's bold icon-led titles
  and the `✓ 2  ✖ 1  ○ 1  - 3` per-outcome strip. Zero counts render as `--`.
- `color.*` — `pass`/`fail`/`pending`/`muted`/`alias`/… . `color.muted` is the
  default for de-emphasized trailing detail (relative times, an absent value
  shown as `—`).
- `emptyState(msg)` — dim placeholder text, the **same** `chalk.dim` as
  `heading`, so a placeholder sits in the header's gray.

## The command-log row grammar (`command-row.ts`)

One level up from `format.ts`: the row vocabulary the two renderers that show
command log entries share — `reporter`'s full log and `command`'s single entry —
so a row reads identically whichever one printed it. `formatMessage` (assert
state colors, `**emphasis**`, `@alias` tinting), `commandLabel` (the `-` prefix on
a chained command), `networkDot`, and the `aliasSuffix` / `networkSuffix` /
`cleanedSuffix` trailing badges. They take the structural `RenderableCommand`, so
a renderer reuses them without widening its own result type. Domain-shaped
helpers like these belong here rather than in `format.ts`, which stays free of
contract types.

## Deep payloads open collapsed (`console-props.ts`)

A command's console properties are the one result with no bounded shape — a
`cy.request` row carries its matcher, request, response and every header of each.
Printing it whole is pages of indentation, so the renderer shows the **shape**
first, the way the browser console panel does: a few levels expand, a section
that is deeper — or too long to take in at a glance — reads as `{n keys}` /
`[n items]`, and a footer names the two ways to open it (`--depth`, `--path`).
Depth and a per-section row budget are separate dials on purpose: depth alone
either buries you in header maps or hides the nesting you came for, and an
explicit `--depth` lifts the budget since it asked for levels, not for a
judgement about size. Values are clamped to the room left on their row, since a
soft-wrapped line breaks the column it was padded into. Reach for the same
three moves — summarize, offer the drill-down, clamp to width — for any future
result whose depth the CLI does not control.

`--depth` and `--path` are **view options**: declared by the rendering
(`TapCommandRendering.options`), rendered into the command's help like any other
flag, but collected apart from the schema's and never sent to the instance. A
flag that only changes how a result reads belongs there — it then works against
any instance version that has the command at all.

## Conventions worth keeping

- **Empty states keep the frame.** Prefer the command's normal shape with a
  placeholder over a bare sentence, so the output reads the same whether or not
  there's data. `specs` with no specs renders the heading plus a dim
  `[EMPTY PROJECT]` row (`SPECS (0)`), not "No specs found." Use `emptyState`
  for the placeholder so it matches the heading gray.
- **A count in the heading, not prose.** `heading('X', n)` over "There are n X".
- **Muted for secondary, `—` for absent.** Missing testing type, no attached
  browser, no timestamp — a muted em dash, never blank or "null".
- **Guard/lifecycle messages are their own thing.** A "no instance / no browser"
  guard is the discovery layer speaking, not the command's empty rendering;
  don't dress it up as data.

## Adding a command renderer

1. Write `renderX.ts` exporting `renderXHuman(result: <TypedResult>): string`
   that returns `layout([...blocks])` built from `format.ts` primitives.
2. Register it in [`index.ts`](./index.ts) under the command name. Declaring
   `renderHuman` makes the command print the rendering by default; `--json`
   bypasses it. A command with no entry keeps printing JSON, and a `renderHuman`
   that returns undefined declines for the options it was invoked with — what
   `command --props --full-report` does, since a payload asked for in full is
   one to pipe somewhere, not to read.
3. The `result` shape is the command's typed interface from the shared
   `@packages/cypress-instances` contract — render from that, and let anything
   machine-facing stay reachable through `--json`.
