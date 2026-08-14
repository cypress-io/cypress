export const TAP_SCHEMA_VERSION = 1

export const TAP_BINDING_GLOBAL = '__CYPRESS_TAP_BINDING__'

export const TAP_SCHEMA_METHOD = 'getSchema'

export const TAP_EXEC_METHOD = 'exec'

export const TAP_RUN_IN_PROGRESS_MESSAGE = 'a spec is currently running — call `cypress tap status` to check its current status; wait for it to finish before trying again'

export interface TapCommandParamSchema {
  name: string
  type: 'string' | 'number' | 'boolean'
  required: boolean
  description: string
}

interface TapCommandOptionBase {
  name: string
  // A single letter, rendered by the CLI as `-t, --test-id <test-id>`. Commander
  // accepts a letter claimed twice within one command and silently lets the last
  // declaration win, so an alias must be unique across the command's own options
  // and the `--session` every command shares.
  alias?: string
  required: boolean
  description: string
}

// `defaultValue` is the value a command sees when the flag is absent, so a
// handler never restates a default its own help already promises. The CLI hands
// it to commander, which both applies it and renders `(default: …)` — so a
// description must not spell the default out a second time. Pairing it with
// `type` keeps the two from disagreeing: a boolean flag is already
// absent-means-false, so it takes none, and a required option can't need one.
type TapCommandOptionDefault =
  | { type: 'string', defaultValue?: string }
  | { type: 'number', defaultValue?: number }
  | { type: 'boolean', defaultValue?: never }

export type TapCommandOptionSchema = TapCommandOptionBase & TapCommandOptionDefault

export interface TapCommandSchema {
  name: string
  description: string
  // Longer prose for the command's standalone `--help`; the one-line
  // `description` still renders in the command listing.
  details?: string
  params: readonly TapCommandParamSchema[]
  options: readonly TapCommandOptionSchema[]
  // Absent ⇒ visible. A hidden command stays exec-able but the CLI omits it from
  // its command listing (e.g. a binding the CLI wraps in a friendlier command).
  hidden?: boolean
}

export interface TapSchema {
  schemaVersion: number
  cypressVersion: string
  commands: TapCommandSchema[]
}

export type TapExecResult =
  | { result: unknown }
  | { error: { code: string, message: string } }

// How a command's declared params/options surface to its handler, derived once
// here so the app's defineCommand and the CLI's defineNativeCommand type handlers
// the same way: entries matching `Present` are keys the handler can rely on, the
// rest may be absent, and each wire `type` maps through `Scalars`.
type SchemaObject<
  Entry extends { name: string, type: TapCommandParamSchema['type'] },
  Present,
  Scalars extends Record<TapCommandParamSchema['type'], unknown>,
> =
  { [E in Entry as E extends Present ? E['name'] : never]: Scalars[E['type']] } &
  { [E in Entry as E extends Present ? never : E['name']]?: Scalars[E['type']] }

// An option carrying a default is present however it was invoked, so both sides
// see it alongside the ones their caller is made to supply.
type Defaulted = { defaultValue: string | number }

// App-side handlers see coerced values (the binding's exec coerces each wire
// string to its declared scalar before dispatch): required params are present,
// and boolean options default to false when the flag is absent.
type CoercedScalars = { string: string, number: number, boolean: boolean }

export type TapCoercedParams<P extends readonly TapCommandParamSchema[]> =
  SchemaObject<P[number], { required: true }, CoercedScalars>

export type TapCoercedOptions<O extends readonly TapCommandOptionSchema[]> =
  SchemaObject<O[number], { required: true } | { type: 'boolean' } | Defaulted, CoercedScalars>

// CLI-side handlers see commander's values forwarded as raw strings (a set
// boolean flag arrives as the string 'true'). Only required value options are
// commander-enforced, so everything else may be absent.
type RawScalars = { string: string, number: string, boolean: string }

export type TapRawParams<P extends readonly TapCommandParamSchema[]> =
  SchemaObject<P[number], { required: true }, RawScalars>

export type TapRawOptions<O extends readonly TapCommandOptionSchema[]> =
  SchemaObject<O[number], { required: true, type: 'string' | 'number' } | Defaulted, RawScalars>

// Options that recur across commands, defined once so their name, type, and help
// text can't drift between the commands that expose them. `test-id` and
// `command-id` are required in some commands and optional in others, so each use
// spreads it and sets `required`; the rest are identical everywhere and used
// directly.
const testIdField = { name: 'test-id', alias: 't', type: 'string', description: 'test id, as listed by the reporter command' } as const
const commandIdField = { name: 'command-id', alias: 'c', type: 'string', description: 'command id, as listed by the reporter command — a row number (test body first when duplicated), an e-prefixed event id, or hook-qualified like "h1:3"' } as const
const attemptField = { name: 'attempt', alias: 'a', type: 'number', required: false, description: '1-based attempt (attempt 1 = first run); defaults to the latest' } as const
const selectorField = { name: 'selector', alias: 'e', type: 'string', required: false, description: 'a CSS selector' } as const

const commandMeta = {
  name: 'command',
  description: 'detail one command log entry of a test — its reporter row, the DOM snapshots pinnable on it, and its console properties',
  params: [],
  options: [
    { ...testIdField, required: true },
    { ...commandIdField, required: true },
    // `--json` is the CLI's own flag, but this command declares it because it
    // also changes what the command returns: nothing is withheld from a payload
    // that is not being rendered for reading room.
    { name: 'json', type: 'boolean', required: false, description: 'print the raw JSON result instead of the human-readable rendering — every console property in full, however long, rather than the long ones named by their length' },
    attemptField,
    { name: 'depth', alias: 'd', type: 'string', required: false, description: 'how many levels of nested console properties to expand before summarizing the rest as "{n keys}" / "[n items]": a number or "all" (default 3, and a section over 8 rows folds at any depth unless this is passed)' },
  ],
} as const satisfies TapCommandSchema

const reporterMeta = {
  name: 'reporter',
  description: 'render a test’s full reporter view — its routes, hooks, and command log — or, without --test-id, the spec-level overview: run stats and every suite’s tests',
  details: `Shows test results the way the Cypress app's reporter panel does, right in
your terminal. Pass --test-id <id> (test ids come from the spec overview this
same command prints with no --test-id) to see one
test's full story: its network routes, the hooks that ran, the complete
command log, and the failure output when something went wrong. Add --attempt
to view an earlier retry.

Leave --test-id off to get the spec-level overview instead: the run's pass/fail
stats and every suite's tests at a glance.`,
  params: [],
  options: [
    { ...testIdField, required: false },
    attemptField,
  ],
} as const satisfies TapCommandSchema

const pinMeta = {
  name: 'pin',
  description: 'pin a command’s DOM snapshot into the live app-under-test frame so the dom/aria/inspect commands can read it; pass --clear to release',
  params: [],
  options: [
    { ...testIdField, required: false },
    { ...commandIdField, required: false },
    attemptField,
    { name: 'at', type: 'string', required: false, description: 'which snapshot to pin: a name like "before"/"after" or a 1-based index; defaults to the last (the command’s final state). Re-run on the pinned command to switch snapshots without releasing the pin' },
    { name: 'clear', type: 'boolean', required: false, description: 'release the current pin and restore the app to its pre-pin state' },
  ],
} as const satisfies TapCommandSchema

const runStateMeta = {
  name: 'run-state',
  description: 'report where the running Cypress session is in its run lifecycle',
  params: [],
  options: [],
  hidden: true,
} as const satisfies TapCommandSchema

const resolveSelectorMeta = {
  name: 'resolve-selector',
  description: 'list a unique CSS selector for each element a selector matches, null for any match none could be derived for',
  params: [
    { name: 'selector', type: 'string', required: true, description: 'a CSS selector' },
  ],
  options: [],
  hidden: true,
} as const satisfies TapCommandSchema

// The canonical command metadata, the single source both sides build a schema
// from: the running session advertises it over the binding (see the app's
// TapManager), and the CLI stamps it with its own version to render help with no
// session attached. Order here is the order commands list in help.
export const TAP_COMMANDS = [
  commandMeta,
  reporterMeta,
  pinMeta,
  runStateMeta,
  resolveSelectorMeta,
] as const satisfies readonly TapCommandSchema[]

export type TapCommandName = typeof TAP_COMMANDS[number]['name']

export const buildTapSchema = (cypressVersion: string): TapSchema => {
  const commands = TAP_COMMANDS.map((command): TapCommandSchema => {
    return {
      name: command.name,
      description: command.description,
      ...('details' in command ? { details: command.details } : {}),
      params: (command.params as readonly TapCommandParamSchema[]).map((param) => ({ ...param })),
      options: (command.options as readonly TapCommandOptionSchema[]).map((option) => ({ ...option })),
      ...('hidden' in command && command.hidden ? { hidden: true } : {}),
    }
  })

  return {
    schemaVersion: TAP_SCHEMA_VERSION,
    cypressVersion,
    commands,
  }
}

export interface TapNativeCommandSchema {
  name: string
  description: string
  details: string
  params?: readonly TapCommandParamSchema[]
  options?: readonly TapCommandOptionSchema[]
}

const runMeta = {
  name: 'run',
  description: 'run (or rerun) a spec by its project-relative path',
  details: `Runs (or reruns) a spec by its project-relative path, as listed by the specs
command. If no browser is open it launches one, switching to the spec's testing
type when needed, then requests the run and returns immediately — returning does
not mean the run has started, let alone finished.

Poll the status command for run progress. Read status first and keep its
startedAt: a verdict still carrying that same startedAt describes the run before
this one, so wait for a verdict whose startedAt differs.`,
  params: [
    { name: 'spec', type: 'string', required: true, description: 'project-relative spec path, as listed by the specs command' },
  ],
} as const satisfies TapNativeCommandSchema

const sessionsMeta = {
  name: 'sessions',
  description: 'list the running Cypress sessions this CLI can reach',
  details: `Lists the running Cypress sessions this CLI can reach, as a JSON array. Pass
a session's pid to \`--session\` to target it with another tap command.

tap only supports Chromium based browsers (Chrome, Chromium, Edge, Electron).
A session running any other browser is listed as unsupported, and every other
tap command refuses it.`,
} as const satisfies TapNativeCommandSchema

const statusMeta = {
  name: 'status',
  description: 'report where a running Cypress session is in its lifecycle',
  details: `Reports where a running Cypress session is in its lifecycle, as JSON — for
polling and "where am I?" checks. Always exits 0 for a determinable stage
(including "not connected"); a poller branches on the \`status\` field.

Stages: not connected, browser not selected, spec not selected, loading,
running, passed, failed.

Only passed and failed are verdicts. Loading is a selected spec still building,
and stays loading for as long as the build takes, so a poller needs its own
timeout. A spec whose build fails reports failed and carries the reason as
error — it ran no tests, so it reports no counts either.

From loading onwards the output carries startedAt, the run every other field
describes (null while loading). A rerun leaves the previous run's verdict
readable until the incoming run starts, identical on every other field, so
compare startedAt before believing a verdict.`,
} as const satisfies TapNativeCommandSchema

const specsMeta = {
  name: 'specs',
  description: 'list the specs the running Cypress session can run, most recently modified first',
  details: `Lists the specs the connected Cypress session can run, in descending order by last modified. To find other testing types you must open a new
cypress session with that testing type specified.`,
} as const satisfies TapNativeCommandSchema

// Every selector these three take must resolve to exactly one element, so a
// reader is never silently shown one of several matches. Their help says so in
// the same words, and names the remedy the ambiguity error offers.
const SINGLE_ELEMENT_SELECTOR = 'a CSS selector matching exactly one element'

const AMBIGUOUS_SELECTOR_HELP = `The selector must match exactly one element. When it matches more, nothing is
read: the command answers with a numbered list of the matches, each with a
unique selector. Re-run with --at <index> to read one of them, or with whichever
selector you meant.`

// Where `dom` and `aria` read from with no selector: the document element only
// adds a <head> of script and style text; `--selector html` still reads it.
const TAP_DEFAULT_SELECTOR = 'body'

// Shared by the three selector-taking reads, so the way you pick one match out
// of several is identical across them.
const atField = {
  name: 'at',
  type: 'number',
  required: false,
  description: '0-based index of the match to read, as listed by the index column when a selector matches several',
} as const satisfies TapCommandOptionSchema

const domMeta = {
  name: 'dom',
  description: 'read the app-under-test DOM as HTML: the page body, or the one element a selector matches (with its subtree)',
  details: `Reads the app-under-test DOM as HTML: the outerHTML of the element a CSS
selector matches, including its full subtree. Without --selector it reads the
page body; pass --selector html for the whole document. Output is capped
browser-side so a heavy page never ships megabytes at once.

${AMBIGUOUS_SELECTOR_HELP}`,
  params: [],
  options: [
    { ...selectorField, defaultValue: TAP_DEFAULT_SELECTOR, description: SINGLE_ELEMENT_SELECTOR },
    { name: 'max-chars', alias: 'm', type: 'number', required: false, defaultValue: 30_000, description: 'cap on returned HTML characters' },
    atField,
  ],
} as const satisfies TapNativeCommandSchema

const ariaMeta = {
  name: 'aria',
  description: 'read the accessibility (ARIA) tree of the app-under-test page body, or the subtree at a selector',
  details: `Reads the accessibility (ARIA) tree of the app under test, rooted at the page
body or at the element a CSS selector matches. Structural and text-only roles
are dropped, leaving the compact role/name/state tree DevTools shows.

${AMBIGUOUS_SELECTOR_HELP}`,
  params: [],
  options: [
    { ...selectorField, defaultValue: TAP_DEFAULT_SELECTOR, description: `${SINGLE_ELEMENT_SELECTOR} to root the tree at` },
    // The accessibility tree of a real app is deep; the cap keeps the projection
    // affordable for an LLM. A selector roots it at a subtree for finer reads.
    { name: 'max-nodes', alias: 'm', type: 'number', required: false, defaultValue: 200, description: 'cap on the number of accessibility nodes returned' },
    atField,
  ],
} as const satisfies TapNativeCommandSchema

const inspectMeta = {
  name: 'inspect',
  description: 'inspect the element a selector matches: its tag, attributes, computed styles, box model, and accessibility node',
  details: `Inspects the element the selector matches: its tag, attributes, curated
computed styles, box model, and accessibility node.

${AMBIGUOUS_SELECTOR_HELP}`,
  params: [],
  options: [
    { ...selectorField, required: true, description: `${SINGLE_ELEMENT_SELECTOR}, identifying the element to inspect` },
    atField,
  ],
} as const satisfies TapNativeCommandSchema

// CLI-native tap commands: implemented entirely in the CLI (session discovery
// over the filesystem, DOM/ARIA reads over CDP), so — unlike TAP_COMMANDS — they
// are never advertised by getSchema or exec'd on the session. Listed here in the
// order they appear in help, ahead of the schema-driven commands.
export const TAP_NATIVE_COMMANDS = [
  sessionsMeta,
  statusMeta,
  specsMeta,
  runMeta,
  domMeta,
  ariaMeta,
  inspectMeta,
] as const satisfies readonly TapNativeCommandSchema[]

export type TapNativeCommandName = typeof TAP_NATIVE_COMMANDS[number]['name']

const allTapCommands: readonly (TapCommandSchema | TapNativeCommandSchema)[] = [...TAP_NATIVE_COMMANDS, ...TAP_COMMANDS]

/** Every command name this CLI ships, whether it dispatches to the session or handles it itself. */
export const KNOWN_COMMANDS: ReadonlySet<string> = new Set(allTapCommands.map(({ name }) => name))

// Per-command result contracts live in `./contracts/`; re-exported here so the
// app's deep import of this module and the package barrel both reach them.
export * from './contracts/reporter'

export * from './contracts/command'

export * from './contracts/pinned'

export * from './contracts/pin'

export * from './contracts/resolve-selector'
