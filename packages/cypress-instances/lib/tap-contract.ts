export const TAP_SCHEMA_VERSION = 1

export const TAP_BINDING_GLOBAL = '__CYPRESS_TAP_BINDING__'

export const TAP_SCHEMA_METHOD = 'getSchema'

export const TAP_EXEC_METHOD = 'exec'

export interface TapCommandParamSchema {
  name: string
  type: 'string' | 'number' | 'boolean'
  required: boolean
  description: string
}

export interface TapCommandOptionSchema {
  name: string
  alias?: string
  type: 'string' | 'number' | 'boolean'
  required: boolean
  description: string
}

export interface TapCommandSchema {
  name: string
  description: string
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

// Params/options that recur across commands, defined once so their name, type,
// and help text can't drift between the commands that expose them. `test` is
// required in some commands and optional in others, so each use spreads it and
// sets `required`; `attempt` is identical everywhere and used directly.
const testIdField = { name: 'test', type: 'string', description: 'test id, as listed by the tests command' } as const
const attemptField = { name: 'attempt', type: 'number', required: false, description: '1-based attempt (attempt 1 = first run); defaults to the latest' } as const

const testsMeta = {
  name: 'tests',
  description: 'list the tests of the active run and their state, or detail one by id',
  params: [
    { ...testIdField, required: false },
  ],
  options: [
    attemptField,
  ],
} as const satisfies TapCommandSchema

const commandsMeta = {
  name: 'commands',
  description: 'list the command log entries of a test of the active run',
  params: [],
  options: [
    { ...testIdField, required: true },
    attemptField,
  ],
} as const satisfies TapCommandSchema

const pinMeta = {
  name: 'pin',
  description: 'pin a command’s DOM snapshot into the live app-under-test frame so the dom/aria/inspect commands can read it; pass --clear to release',
  params: [
    { ...testIdField, required: false },
    { name: 'command', type: 'string', required: false, description: 'command id, as listed by the commands command' },
  ],
  options: [
    { name: 'at', type: 'string', required: false, description: 'which snapshot to pin: a name like "before"/"after" or a 1-based index; defaults to the last (the command’s final state). Re-run on the pinned command to switch snapshots without releasing the pin' },
    { name: 'clear', type: 'boolean', required: false, description: 'release the current pin and restore the app to its pre-pin state' },
  ],
} as const satisfies TapCommandSchema

const runStateMeta = {
  name: 'run-state',
  description: 'report where the running Cypress instance is in its run lifecycle',
  params: [],
  options: [],
  hidden: true,
} as const satisfies TapCommandSchema

// The canonical command metadata, the single source both sides build a schema
// from: the running instance advertises it over the binding (see the app's
// TapManager), and the CLI stamps it with its own version to render help with no
// instance attached. Order here is the order commands list in help.
export const TAP_COMMANDS = [
  testsMeta,
  commandsMeta,
  pinMeta,
  runStateMeta,
] as const satisfies readonly TapCommandSchema[]

export type TapCommandName = typeof TAP_COMMANDS[number]['name']

export const buildTapSchema = (cypressVersion: string): TapSchema => {
  const commands = TAP_COMMANDS.map((command): TapCommandSchema => {
    return {
      name: command.name,
      description: command.description,
      params: command.params.map((param) => ({ ...param })),
      options: command.options.map((option) => ({ ...option })),
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
type when needed, then starts the run and returns immediately — it does not wait
for the run to finish. Poll the status command for run progress.`,
  params: [
    { name: 'spec', type: 'string', required: true, description: 'project-relative spec path, as listed by the specs command' },
  ],
} as const satisfies TapNativeCommandSchema

const instancesMeta = {
  name: 'instances',
  description: 'list the running Cypress instances this CLI can reach',
  details: `Lists the running Cypress instances this CLI can reach, as a JSON array. Pass
an instance's pid to \`--instance\` to target it with another tap command.`,
} as const satisfies TapNativeCommandSchema

const statusMeta = {
  name: 'status',
  description: 'report where a running Cypress instance is in its lifecycle',
  details: `Reports where a running Cypress instance is in its lifecycle, as JSON — for
polling and "where am I?" checks. Always exits 0 for a determinable stage
(including "not connected"); a poller branches on the \`status\` field.

Stages: not connected, browser not selected, spec not selected, running,
passed, failed.`,
} as const satisfies TapNativeCommandSchema

const specsMeta = {
  name: 'specs',
  description: 'list the specs the running Cypress instance can run',
  details: `Lists the specs the running Cypress instance can run. To find other testing types you must open a new cypress instance with that testing type specified.`,
} as const satisfies TapNativeCommandSchema

const domMeta = {
  name: 'dom',
  description: 'read the app-under-test DOM as HTML: the whole page, or each element matching a selector (with its subtree)',
  details: `Reads the app-under-test DOM as HTML: the whole page, or the outerHTML of
each element matching a CSS selector (each match includes its full subtree).
Output is capped browser-side so a heavy page never ships megabytes at once.`,
  params: [{ name: 'selector', type: 'string', required: false, description: 'a CSS selector; omit to read the whole document' }],
  options: [{ name: 'max-chars', type: 'string', required: false, description: 'cap on returned HTML characters (default 30000)' }],
} as const satisfies TapNativeCommandSchema

const ariaMeta = {
  name: 'aria',
  description: 'read the accessibility (ARIA) tree of the app-under-test frame, or the subtree at a selector',
  details: `Reads the accessibility (ARIA) tree of the app-under-test frame, or the
subtree rooted at a CSS selector. Structural and text-only roles are dropped,
leaving the compact role/name/state tree DevTools shows.`,
  params: [{ name: 'selector', type: 'string', required: false, description: 'a CSS selector to root the tree at; omit for the whole frame' }],
  options: [{ name: 'max-nodes', type: 'string', required: false, description: 'cap on the number of accessibility nodes returned (default 200)' }],
} as const satisfies TapNativeCommandSchema

const inspectMeta = {
  name: 'inspect',
  description: 'inspect the first element matching a selector: its tag, attributes, computed styles, box model, and accessibility node',
  details: `Inspects the first element matching the selector: its tag, attributes,
curated computed styles, box model, and accessibility node.`,
  params: [{ name: 'selector', type: 'string', required: true, description: 'a CSS selector identifying the element to inspect' }],
} as const satisfies TapNativeCommandSchema

// CLI-native tap commands: implemented entirely in the CLI (instance discovery
// over the filesystem, DOM/ARIA reads over CDP), so — unlike TAP_COMMANDS — they
// are never advertised by getSchema or exec'd on the instance. Listed here in the
// order they appear in help, ahead of the schema-driven commands.
export const TAP_NATIVE_COMMANDS = [
  instancesMeta,
  statusMeta,
  specsMeta,
  runMeta,
  domMeta,
  ariaMeta,
  inspectMeta,
] as const satisfies readonly TapNativeCommandSchema[]

export type TapNativeCommandName = typeof TAP_NATIVE_COMMANDS[number]['name']
