import chalk from 'chalk'

import type { TapCommandOptionSchema, TapConsoleProps, TapJsonValue } from '@packages/cypress-instances'
import { clamp, color, emptyState, heading, layout, tableRows, terminalWidth } from './format'

// A command's console properties are the deepest payload the tap returns — a
// `cy.request` row carries its matcher, request, response and every header of
// each. Printed whole it is pages of indentation, so this renders the shape
// first, the way the browser console panel opens collapsed: a few levels expand,
// and a section that is deeper or too long to read at a glance is summarized as
// `{n keys}` / `[n items]` until --depth or --path asks for it. The full payload is one
// --json away.

// Deep enough that a request's matcher, its response and that response's body
// all read without asking, since a payload is usually consulted for something
// several levels in. The row budget below is what keeps that from running away.
const DEFAULT_DEPTH = 3

// A header map runs to twenty-odd rows and buries everything around it, so the
// default view folds any section that long however shallow it sits. An explicit
// --depth is taken at its word and lifts the cap: it asked for levels, not for a
// judgement about size.
const DEFAULT_ROW_BUDGET = 8

// `--path` segment separator. A `.` reads as part of a key — header names and
// console prop labels contain them — so the levels split on a character that
// never appears in one.
const PATH_SEPARATOR = '>'

// However narrow the terminal, a value keeps enough room to be worth reading.
const MIN_VALUE_WIDTH = 24

// Console prop labels are short prose (`Request Headers`); anything past this is
// a key carrying data, and it does not get to own the level's whole row.
const MAX_KEY_WIDTH = 32

export const consolePropsOptions: readonly TapCommandOptionSchema[] = [
  { name: 'depth', type: 'string', required: false, description: 'how many levels of nested console properties to expand before summarizing the rest as "{n keys}" / "[n items]": a number or "all" (default 3, and a section over 8 rows folds at any depth unless this is passed)' },
  { name: 'path', type: 'string', required: false, description: 'show one section of the console properties instead of the whole payload, addressed from the top level as "Response>headers" (case-insensitive, ">"-separated)' },
]

export interface ConsolePropsOptions {
  depth?: string
  path?: string
}

const isRecord = (value: TapJsonValue): value is { [key: string]: TapJsonValue } => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const isContainer = (value: TapJsonValue): boolean => typeof value === 'object' && value !== null

// The serializer names a value too long to ship by its length rather than
// returning it (see the driver's `withheld`); color the marker so it doesn't
// read as content.
const WITHHELD = /^\[[\d,]+ characters? withheld — pass --json to include it\]$/

// A response body or stack trace carries its own newlines; inlining it would
// break the aligned column, so it reads as a block under its key.
const isBlock = (value: TapJsonValue): value is string => typeof value === 'string' && value.includes('\n')

interface InlineValue {
  /** Plain text, so a column width and a clamp can be measured against it. */
  text: string
  style?: (text: string) => string
  /** Set on a real value; a summary or empty marker is short by construction. */
  clampable?: true
}

// A response body or header value arrives with whatever bytes the server sent.
// A tab re-tabulates the row and a lone carriage return overwrites it, so on a
// row — where the alignment is the only thing holding the output together — they
// read as spaces. Escape codes are dropped rather than passed through: they would
// tint a row the renderer never meant to and their bytes count toward the clamp.
// eslint-disable-next-line no-control-regex -- matching the escape byte is the point
const ANSI = /\u001b\[[0-9;]*[a-zA-Z]/g
// eslint-disable-next-line no-control-regex -- matching the control bytes is the point
const CONTROL = /[\u0000-\u0009\u000b-\u001f]/g

const onOneRow = (text: string): string => text.replace(ANSI, '').replace(CONTROL, ' ')

// A key is always one row, newline or not — the control range above spares `\n`
// for the values that render as a block under their key.
const asKey = (text: string): string => onOneRow(text).replace(/\n/g, ' ').trim()

const scalarInline = (value: TapJsonValue): InlineValue => {
  if (value === null) {
    return { text: 'null', style: chalk.dim }
  }

  const text = onOneRow(String(value))

  if (typeof value === 'string' && WITHHELD.test(text)) {
    return { text, style: color.aborted }
  }

  if (!text.length) {
    return { text: '(empty string)', style: chalk.dim }
  }

  return { text, clampable: true }
}

const emptyContainerInline = (value: TapJsonValue): InlineValue | undefined => {
  if (Array.isArray(value) && !value.length) {
    return { text: '[]', style: chalk.dim }
  }

  if (isRecord(value) && !Object.keys(value).length) {
    return { text: '{}', style: chalk.dim }
  }

  return undefined
}

// What a collapsed container reads as: its size, so the shape is still legible
// and the cost of expanding it is known before you do.
const summaryInline = (value: TapJsonValue): InlineValue => {
  const isArray = Array.isArray(value)
  const size = isArray ? value.length : Object.keys(value as object).length
  const unit = isArray ? 'item' : 'key'
  const [open, close] = isArray ? ['[', ']'] : ['{', '}']

  return { text: `${open}${size} ${unit}${size === 1 ? '' : 's'}${close}`, style: chalk.dim }
}

// A cell keeps the column alignment that makes a table readable, so it stays one
// line of bounded width.
const MAX_CELL = 40

const cell = (value: TapJsonValue | undefined): string => {
  if (value === undefined) {
    return ''
  }

  if (Array.isArray(value)) {
    return '[…]'
  }

  if (isRecord(value)) {
    return '{…}'
  }

  // A cell cannot hold the newlines of a multi-line value: they would end the
  // row the table is aligning.
  const text = String(value).replace(/\s+/g, ' ').trim()

  return clamp(text, MAX_CELL)
}

// Rows of like-shaped objects are what the driver's `table` console prop holds
// (its keyboard/mouse event tables) — render them the way the reporter renders a
// table, the row keys themselves as the column headers. A lone row reads better
// as plain key/values, so it is left to the caller.
const rowsTable = (values: TapJsonValue[], indent: string): string[] | undefined => {
  if (values.length < 2 || !values.every(isRecord)) {
    return undefined
  }

  const columnKeys = [...new Set(values.flatMap((row) => Object.keys(row)))]

  if (!columnKeys.length) {
    return undefined
  }

  const rows = values.map((row) => columnKeys.map((column) => cell(row[column])))

  // Cells are plain here, so coloring them after padding is a no-op width-wise;
  // the withheld marker still needs its hue.
  return tableRows(columnKeys, rows, (cells) => cells.map((text) => (WITHHELD.test(text.trim()) ? color.aborted(text) : text)))
  .map((line) => `${indent}${line}`)
}

type PropsValue = { [key: string]: TapJsonValue } | TapJsonValue[]

const entriesOf = (value: PropsValue): Array<[string, TapJsonValue]> => {
  return Array.isArray(value)
    ? value.map((item, index): [string, TapJsonValue] => [String(index + 1), item])
    : Object.entries(value)
}

interface PropsRenderer {
  renderProps: (value: PropsValue, level: number, trail?: string[]) => string[]
  /** A value that carries its own newlines, or one too long for a row, under its key. */
  block: (text: string, indent: string) => string[]
  /** Like-shaped object rows as a table, or undefined for values that aren't. */
  rows: (values: TapJsonValue[], indent: string) => string[] | undefined
  /** The `>`-joined path of every container the render summarized. */
  collapsed: string[][]
}

/**
 * Renders a properties tree to `maxDepth` levels of containers, collecting the
 * `>`-joined path of each container it summarized so the caller can offer them
 * as the next command to run.
 */
const createPropsRenderer = (maxDepth: number, rowBudget: number): PropsRenderer => {
  const collapsed: string[][] = []

  const block = (text: string, indent: string): string[] => blockLines(text, indent)
  const rows = (values: TapJsonValue[], indent: string): string[] | undefined => rowsTable(values, indent)

  // Scalars align in one column with their sibling scalars; a container gets its
  // own key line with its children indented beneath it, so nesting reads as
  // structure rather than punctuation.
  const renderProps = (value: PropsValue, level: number, trail: string[] = []): string[] => {
    const indent = '  '.repeat(level + 1)
    const childIndent = '  '.repeat(level + 2)
    const entries = entriesOf(value)

    const inlined = new Map(entries.flatMap(([key, child]): Array<[string, InlineValue]> => {
      if (isBlock(child)) {
        return []
      }

      if (!isContainer(child)) {
        return [[key, scalarInline(child)]]
      }

      const empty = emptyContainerInline(child)

      if (empty) {
        return [[key, empty]]
      }

      if (level < maxDepth && entriesOf(child as PropsValue).length <= rowBudget) {
        return []
      }

      collapsed.push([...trail, key])

      return [[key, summaryInline(child)]]
    }))

    // One outlier key would otherwise push every value on the level out past the
    // terminal, so the column it shares stops at a width a row can carry.
    const label = (key: string): string => clamp(asKey(key) || '(empty key)', MAX_KEY_WIDTH)
    const width = Math.max(0, ...[...inlined.keys()].map((key) => label(key).length))
    const valueWidth = Math.max(MIN_VALUE_WIDTH, terminalWidth() - indent.length - width - 2)

    return entries.flatMap(([key, child]) => {
      const inline = inlined.get(key)
      const keyLine = `${indent}${chalk.dim(label(key))}`

      if (inline) {
        const text = inline.clampable ? clamp(inline.text, valueWidth) : inline.text

        return [`${indent}${chalk.dim(label(key).padEnd(width))}  ${inline.style ? inline.style(text) : text}`]
      }

      if (isBlock(child)) {
        return [keyLine, ...block(child, childIndent)]
      }

      const table = Array.isArray(child) ? rows(child, indent) : undefined

      return [keyLine, ...(table ?? renderProps(child as PropsValue, level + 1, [...trail, key]))]
    })
  }

  return { renderProps, block, rows, collapsed }
}

const blockLines = (text: string, indent: string): string[] => {
  const width = Math.max(MIN_VALUE_WIDTH, terminalWidth() - indent.length)

  // A body split on its newlines still carries the `\r` of a CRLF payload, which
  // would drag the cursor back over the line it just printed.
  return text.split('\n').map((line) => `${indent}${clamp(onOneRow(line), width)}`)
}

interface DepthChoice {
  depth: number
  /** How many rows a section may have before it folds regardless of its depth. */
  rowBudget: number
  note?: string
}

const readDepth = (value: string | undefined): DepthChoice => {
  const byDefault = { depth: DEFAULT_DEPTH, rowBudget: DEFAULT_ROW_BUDGET }

  if (value === undefined) {
    return byDefault
  }

  if (value.toLowerCase() === 'all') {
    return { depth: Infinity, rowBudget: Infinity }
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 0) {
    return { ...byDefault, note: `--depth takes a whole number or "all"; showing depth ${DEFAULT_DEPTH}.` }
  }

  return { depth: parsed, rowBudget: Infinity }
}

const keysOf = (value: PropsValue): string[] => {
  return Array.isArray(value) ? value.map((_item, index) => String(index + 1)) : Object.keys(value)
}

const childAt = (value: PropsValue, key: string): TapJsonValue => {
  return Array.isArray(value) ? value[Number(key) - 1] : value[key]
}

// A path segment names a key case-insensitively, or an unambiguous prefix of one
// — `response>head` reaches `Response`'s `headers` without matching its case or
// typing it out. A prefix several keys share is reported rather than guessed at.
const matchKey = (value: PropsValue, segment: string): { key: string } | { ambiguous: string[] } | undefined => {
  const keys = keysOf(value)
  const wanted = segment.toLowerCase()
  const exact = keys.find((key) => key.toLowerCase() === wanted)

  if (exact !== undefined) {
    return { key: exact }
  }

  const prefixed = keys.filter((key) => key.toLowerCase().startsWith(wanted))

  if (prefixed.length > 1) {
    return { ambiguous: prefixed }
  }

  return prefixed.length ? { key: prefixed[0] } : undefined
}

interface ResolvedPath {
  value: TapJsonValue
  /** The keys as the payload spells them, for the breadcrumb. */
  trail: string[]
}

interface FailedPath {
  error: string
  /** The keys matched before the walk failed. */
  trail: string[]
}

// A hint has to name the keys that are actually there, so it lists as many as the
// row holds and counts the rest rather than ending mid-word.
const keyList = (keys: string[], room: number): string => {
  const listed: string[] = []
  let width = 0

  for (const key of keys) {
    width += key.length + 2

    if (listed.length && width > room) {
      return `${listed.join(', ')}, … (${keys.length - listed.length} more)`
    }

    listed.push(key)
  }

  return listed.join(', ')
}

// The keys go on their own row, where the whole width is theirs — a list folded
// into the end of the sentence is the half of it you needed.
const listedUnder = (message: string, label: string, keys: string[]): string => {
  return `${message}\n${label}${keyList(keys, Math.max(MIN_VALUE_WIDTH, terminalWidth() - label.length))}`
}

const pathFailure = (segment: string, trail: string[], value: PropsValue): FailedPath => {
  const at = trail.length ? ` under "${trail.join(PATH_SEPARATOR)}"` : ''

  return { error: listedUnder(`No console property named "${segment}"${at}.`, 'Keys here: ', keysOf(value)), trail }
}

const walkPath = (root: PropsValue, segments: string[]): ResolvedPath | FailedPath => {
  let current: TapJsonValue = root
  const trail: string[] = []

  for (const segment of segments) {
    if (!isContainer(current)) {
      return { error: `"${trail.join(PATH_SEPARATOR)}" is a value, not a section — there is nothing under it to reach with "${segment}".`, trail }
    }

    const matched = matchKey(current as PropsValue, segment)

    if (matched === undefined) {
      return pathFailure(segment, trail, current as PropsValue)
    }

    if ('ambiguous' in matched) {
      return { error: listedUnder(`"${segment}" matches more than one key.`, 'Name one of: ', matched.ambiguous), trail }
    }

    current = childAt(current as PropsValue, matched.key)
    trail.push(matched.key)
  }

  return { value: current, trail }
}

// The driver wraps every log's console properties in a fixed envelope
// (see wrapConsoleProps): the command's own key/values live under `props`, with
// `table`/`groups`/`error`/`args` as siblings. Rendering the envelope rather
// than the raw payload is what lifts the interesting keys to the top level, the
// way the browser console panel shows them.
const ENVELOPE_KEYS = new Set(['name', 'type', 'props', 'table', 'groups', 'error', 'args'])

// The command this payload belongs to is named by the row printed above it, so
// the title carries only the path drilled into, if any.
const propsHeader = (trail: string[] = []): string => {
  const breadcrumb = trail.length ? ` ${chalk.dim('›')} ${chalk.bold(trail.join(chalk.dim(' › ')))}` : ''

  return `${heading('CONSOLE PROPS')}${breadcrumb}`
}

// The reporter's failure palette (see its error panel): a red title over the
// lighter hue it prints a failure's own text in.
const ERROR_TINT = { title: color.fail, line: color.errHeaderText }

// An envelope key beside `props`, as its own titled section. A tinted section
// colors its title and its lines — the error arrives as a stack, so what carries
// the color is the block, not a props tree.
const extraSection = (title: string, value: TapJsonValue, render: PropsRenderer, tint?: typeof ERROR_TINT): string[][] => {
  if (value == null) {
    return []
  }

  const sectionTitle = tint ? tint.title(title) : heading(title)

  if (isContainer(value)) {
    return emptyContainerInline(value) ? [] : [[sectionTitle, ...render.renderProps(value as PropsValue, 0, [title])]]
  }

  const lines = render.block(String(value), '  ')

  return [[sectionTitle, ...(tint ? lines.map((line) => tint.line(line)) : lines)]]
}

// Each table the driver logged is a slot in `table`, keyed by the order it
// should render in and carrying its own display name — the reporter's tables,
// straight across.
const tableSections = (value: TapJsonValue, render: PropsRenderer): string[][] => {
  if (!isRecord(value)) {
    return extraSection('TABLE', value, render)
  }

  return Object.keys(value)
  .sort((a, b) => Number(a) - Number(b))
  .flatMap((slot): string[][] => {
    const entry = value[slot]

    if (!isRecord(entry)) {
      return []
    }

    const title = (typeof entry.name === 'string' ? entry.name : `table ${slot}`).toUpperCase()
    const data = entry.data
    const table = Array.isArray(data) ? render.rows(data, '') : undefined

    if (table) {
      return [[heading(title, (data as TapJsonValue[]).length), ...table]]
    }

    const body = isContainer(data) ? data as { [key: string]: TapJsonValue } : entry

    return [[heading(title), ...render.renderProps(body, 0, [title])]]
  })
}

const shellQuote = (value: string): string => {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

// What was left folded, and the two ways to open it: straight to the one section
// that matters, or the whole payload. A depth suggestion is deliberately absent —
// a section can fold for its size as well as its depth, so `--depth n + 1` is not
// a promise this can keep.
const collapsedFooter = (collapsed: string[][]): string[][] => {
  if (!collapsed.length) {
    return []
  }

  const count = collapsed.length
  const sections = `${count} section${count === 1 ? '' : 's'}`
  const path = `--path ${shellQuote(collapsed[0].join(PATH_SEPARATOR))}`
  const hint = `${sections} collapsed — open one with ${path}, or all of it with --depth all`

  if (hint.length <= terminalWidth()) {
    return [[chalk.dim(hint)]]
  }

  // On a narrow terminal the path takes a row of its own rather than being
  // broken across two: a path with a space in it is there to be copied, and a
  // line break lands inside its quotes.
  return [[chalk.dim(`${sections} collapsed — open all of it with --depth all, or one with:`), chalk.dim(`  ${path}`)]]
}

const pathRoot = (envelope: TapConsoleProps): PropsValue => {
  const props = envelope.props

  return isRecord(props) ? props : envelope
}

// Named tables and OTHER are display panels rather than keys in the serialized
// envelope. Mirror those panels here so every path printed by collapsedFooter
// is also accepted when copied back into --path.
const panelPathRoot = (envelope: TapConsoleProps): PropsValue => {
  if (!isRecord(envelope.props)) {
    return {}
  }

  const panels: { [key: string]: TapJsonValue } = {}
  const tables = envelope.table

  if (isRecord(tables)) {
    Object.keys(tables).forEach((slot) => {
      const entry = tables[slot]

      if (!isRecord(entry)) {
        return
      }

      const title = (typeof entry.name === 'string' ? entry.name : `table ${slot}`).toUpperCase()

      panels[title] = isContainer(entry.data) ? entry.data : entry
    })
  } else if (tables !== undefined) {
    panels.TABLE = tables
  }

  const unexpected = Object.fromEntries(Object.entries(envelope).filter(([key]) => !ENVELOPE_KEYS.has(key)))

  if (Object.keys(unexpected).length) {
    panels.OTHER = unexpected
  }

  return panels
}

const renderPath = (envelope: TapConsoleProps, path: string, render: PropsRenderer): string[][] => {
  const segments = path.split(PATH_SEPARATOR).map((segment) => segment.trim()).filter(Boolean)

  if (!segments.length) {
    return [[emptyState(`--path takes a "${PATH_SEPARATOR}"-separated property path, e.g. --path "Response${PATH_SEPARATOR}headers".`)]]
  }

  // `props` holds what the top level shows, but the envelope's own sections
  // (table, error, snapshot) are addressable by name too.
  const root = pathRoot(envelope)
  const roots = root === envelope ? [root] : [root, panelPathRoot(envelope), envelope]
  const attempts = roots.map((candidate) => walkPath(candidate, segments))
  const found = attempts.find((attempt) => !('error' in attempt)) ?? attempts.reduce((best, attempt) => {
    return attempt.trail.length > best.trail.length ? attempt : best
  })

  if ('error' in found) {
    return [[emptyState(found.error)]]
  }

  const header = propsHeader(found.trail)

  if (!isContainer(found.value)) {
    // An explicit path asks for exactly this value, so it prints whole.
    return [[header, ...render.block(found.value === null ? 'null' : String(found.value), '  ')]]
  }

  const table = Array.isArray(found.value) ? render.rows(found.value, '') : undefined
  const body = withBody(table ?? render.renderProps(found.value as PropsValue, 0, found.trail))

  return [[header, ...body], ...collapsedFooter(render.collapsed)]
}

// A section can be present and hold nothing — `props: {}`, or a path that lands
// on an empty object. A heading with a void under it reads as a rendering bug, so
// the emptiness is stated.
const withBody = (lines: string[]): string[] => {
  return lines.length ? lines : [`  ${emptyState('(nothing here)')}`]
}

export const renderConsolePropsHuman = (envelope: TapConsoleProps, options: ConsolePropsOptions = {}): string => {
  if (!Object.keys(envelope).length) {
    return emptyState('This command logged no console properties.')
  }

  const { depth, rowBudget, note } = readDepth(options.depth)
  const noteBlock = note ? [[emptyState(note)]] : []
  const render = createPropsRenderer(depth, rowBudget)

  if (options.path) {
    return layout([...renderPath(envelope, options.path, render), ...noteBlock])
  }

  const props = envelope.props

  // A payload with no envelope — the driver's stand-in for a command whose
  // details it has since evicted — is rendered as it arrives.
  if (!isRecord(props)) {
    return layout([[heading('CONSOLE PROPS'), ...withBody(render.renderProps(envelope, 0))], ...collapsedFooter(render.collapsed), ...noteBlock])
  }

  const { table: tables, groups, error, args } = envelope
  const unexpected = Object.fromEntries(Object.entries(envelope).filter(([key]) => !ENVELOPE_KEYS.has(key)))

  return layout([
    [propsHeader(), ...withBody(render.renderProps(props, 0))],
    ...(tables === undefined ? [] : tableSections(tables, render)),
    ...(groups === undefined ? [] : extraSection('GROUPS', groups, render)),
    ...(args === undefined ? [] : extraSection('ARGS', args, render)),
    ...(error === undefined ? [] : extraSection('ERROR', error, render, ERROR_TINT)),
    ...(Object.keys(unexpected).length ? extraSection('OTHER', unexpected, render) : []),
    ...collapsedFooter(render.collapsed),
    ...noteBlock,
  ])
}
