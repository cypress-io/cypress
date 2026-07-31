import chalk from 'chalk'

// The shared formatting vocabulary every tap command's human-readable renderer
// borrows from, so their output reads as one tool: the reporter's palette, its
// state icons, and the table / definition-list / heading / block primitives.
// A renderer composes these into `string[][]` blocks and hands them to `layout`.

// The reporter's own palette (packages/reporter/src/lib/variables.scss and
// commands.scss), so the CLI rendering matches the app: $pass/$fail map to
// jade-400/red-400, assert messages render jade-300/red-400 with jade-200/
// red-300 emphasis, the network dots use the command-message-indicator colors,
// and aliases take the purple badge hue. chalk downsamples the hex values on
// terminals without truecolor.
export const color = {
  pass: chalk.hex('#1fa971'), // $jade-400
  fail: chalk.hex('#e45770'), // $red-400
  passMessage: chalk.hex('#69d3a7'), // $jade-300
  passStrong: chalk.hex('#a3e7cb'), // $jade-200
  failStrong: chalk.hex('#f59aa9'), // $red-300
  errHeaderText: chalk.hex('#f59aa9'), // $err-header-text = $red-300
  aborted: chalk.hex('#db7903'), // $orange-400
  bad: chalk.hex('#c62b49'), // $red-500
  pending: chalk.hex('#6470f3'), // $indigo-400
  alias: chalk.hex('#c8a7f5'), // $purple-300
  aliasDom: chalk.hex('#9aa2fc'), // $indigo-300 — the reporter colors dom aliases indigo
  muted: chalk.hex('#9095ad'), // $gray-500
  fadedId: chalk.hex('#5a5f7a'), // $gray-700 — event ids sit back from the command numbers
}

export type RenderState = 'passed' | 'failed' | 'pending' | 'skipped'

export const stateBadge: Record<RenderState, { icon: string, word: string }> = {
  passed: { icon: color.pass('✓'), word: color.pass('passed') },
  failed: { icon: color.fail('✖'), word: color.fail('failed') },
  pending: { icon: color.pending('○'), word: color.pending('pending') },
  skipped: { icon: color.muted('-'), word: color.muted('skipped') },
}

export interface StateCounts {
  passed: number
  failed: number
  pending: number
  skipped: number
}

// The app header renders a zero count as `--` (its stats strip's `count`
// helper); skipped has no strip slot there, so it only appears when non-zero.
const count = (num: number): string => (num > 0 ? String(num) : '--')

// The reporter's per-outcome strip: `✓ 2  ✖ 1  ○ 1  - 3`. Shared by the reporter
// header and the status command's results line.
export const countsLine = (counts: StateCounts): string => {
  return [
    `${stateBadge.passed.icon} ${count(counts.passed)}`,
    `${stateBadge.failed.icon} ${count(counts.failed)}`,
    `${stateBadge.pending.icon} ${count(counts.pending)}`,
    ...(counts.skipped > 0 ? [`${stateBadge.skipped.icon} ${counts.skipped}`] : []),
  ].join('  ')
}

// A dim panel title, optionally carrying its row count: `ROUTES (2)`.
export const heading = (title: string, itemCount?: number): string => {
  return chalk.dim(itemCount === undefined ? title : `${title} (${itemCount})`)
}

// A bold title line led by a state/action icon, e.g. `✓ App > loads  passed`.
export const titleLine = (icon: string, text: string, suffix?: string): string => {
  return `${icon} ${chalk.bold(text)}${suffix ? `  ${suffix}` : ''}`
}

// A dim note standing in for an absent panel, e.g. `No specs to run.`
export const emptyState = (message: string): string => chalk.dim(message)

export const indent = (depth: number): string => '  '.repeat(depth)

// The column count to lay a row out against, falling back to a readable width
// when the output is piped and the terminal reports none.
export const terminalWidth = (): number => process.stdout.columns || 120

// Keep a value on its own row: a soft-wrapped line breaks out of the column it
// was padded into, so anything longer than the room left for it ends in an
// ellipsis. Clamp before coloring, the way the tables pad before coloring.
export const clamp = (text: string, width: number): string => {
  return text.length <= width ? text : `${text.slice(0, Math.max(1, width - 1))}…`
}

// A value too long for its row that has to stay whole — nothing dropped, and
// still no soft wrap deciding where the break lands. Broken at the last space
// that fits, or mid-token when there is none (a URL, a base64 blob).
export const wrap = (text: string, width: number): string[] => {
  const room = Math.max(1, width)
  const lines: string[] = []
  let rest = text

  while (rest.length > room) {
    const space = rest.lastIndexOf(' ', room)
    const cut = space > 0 ? space : room

    lines.push(rest.slice(0, cut))
    rest = rest.slice(space > 0 ? cut + 1 : cut)
  }

  return [...lines, rest]
}

// Pad before coloring: the escape codes chalk adds would otherwise count
// toward the column width. `colorize` styles the padded cells — it also gets the
// row index, since a padded cell no longer compares equal to the value it holds
// — and defaults to leaving them plain for the tables that don't tint a column.
export const columns = (
  header: string[],
  rows: string[][],
  colorize: (cells: string[], index: number) => string[] = (cells) => cells,
): string[] => {
  const widths = header.map((cell, column) => Math.max(cell.length, ...rows.map((row) => row[column].length)))
  const pad = (cells: string[]) => cells.map((cell, column) => cell.padEnd(widths[column]))

  return [
    pad(header).map((cell) => chalk.dim(cell)).join('  '),
    ...rows.map((row, index) => colorize(pad(row), index).join('  ')),
  ]
}

// Columns rendered as a standalone nested block.
export const tableRows = (
  header: string[],
  rows: string[][],
  colorize?: (cells: string[], index: number) => string[],
): string[] => {
  return columns(header, rows, colorize).map((line) => `${indent(1)}${line}`)
}

// A counted panel title with its content indented beneath it. Content rendered
// on its own — no title to sit under — keeps the left margin.
export const panel = (title: string, count: number | undefined, lines: string[]): string[] => {
  return [heading(title, count), ...lines.map((line) => `${indent(1)}${line}`)]
}

// Columns under a counted panel title.
export const table = (
  title: string,
  header: string[],
  rows: string[][],
  colorize?: (cells: string[], index: number) => string[],
): string[] => {
  return panel(title, rows.length, columns(header, rows, colorize))
}

// Aligned `label  value` rows. Values arrive already styled — callers color
// them before padding matters, since only the labels share a column width.
export const definitionList = (entries: Array<[string, string]>): string[] => {
  const width = Math.max(0, ...entries.map(([label]) => label.length))

  return entries.map(([label, value]) => `  ${label.padEnd(width)}  ${value}`)
}

// Assemble rendered blocks into the final string: lines within a block on their
// own rows, blocks separated by a blank line, trailing whitespace trimmed.
export const layout = (blocks: string[][]): string => {
  return blocks.map((block) => block.map((line) => line.trimEnd()).join('\n')).join('\n\n')
}
