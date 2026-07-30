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
- `columns` / `table` / `definitionList` — aligned columns (bare, or under a
  counted heading) and `label  value` rows. They **pad before coloring** so ANSI
  escape codes never count toward column width; keep that invariant if you
  extend them, and tint from the row's source data (`colorize` gets the row
  index) rather than comparing the padded cell text.
- `titleLine`, `countsLine`, `stateBadge` — the reporter's bold icon-led titles
  and the `✓ 2  ✖ 1  ○ 1  - 3` per-outcome strip. Zero counts render as `--`.
- `color.*` — `pass`/`fail`/`pending`/`muted`/`alias`/… . `color.muted` is the
  default for de-emphasized trailing detail (relative times, an absent value
  shown as `—`).
- `emptyState(msg)` — dim placeholder text, the **same** `chalk.dim` as
  `heading`, so a placeholder sits in the header's gray.

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
- **One thing, one rendering.** When two commands report the same thing, they
  share the block that renders it — the pinned command reads identically from
  `pin` and from `status` (`pinned.ts`), as its own reporter row.
- **One instance, one row.** A command that names the instance it targeted opens
  with the same PID/PROJECT/TYPE/BROWSER row `instances` prints
  (`instanceColumns`), so the two surfaces stay recognizable as the same thing.

## Adding a command renderer

1. Write `renderX.ts` exporting `renderXHuman(result: <TypedResult>): string`
   that returns `layout([...blocks])` built from `format.ts` primitives.
2. Register it in [`index.ts`](./index.ts) under the command name. Declaring
   `renderHuman` makes the command print the rendering by default; `--json`
   bypasses it. A command with no entry keeps printing JSON.
3. The `result` shape is the command's typed interface from the shared
   `@packages/cypress-instances` contract — render from that, and let anything
   machine-facing stay reachable through `--json`.
