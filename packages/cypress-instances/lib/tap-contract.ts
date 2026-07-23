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

// A command's metadata keyed by name — its `name` comes from the map key.
type TapCommandMeta = Omit<TapCommandSchema, 'name'>

// The canonical command metadata, the single source both sides build a schema
// from: the running instance advertises it over the binding (see the app's
// TapManager), and the CLI stamps it with its own version to render help with no
// instance attached. Declaration order is the order commands list in help.
export const TAP_COMMANDS = {
  specs: {
    description: 'List all runnable specs for the selected Cypress instance.',
    params: [],
    options: [],
  },
  run: {
    description: 'run (or rerun) a spec by its project-relative path',
    params: [
      { name: 'spec', type: 'string', required: true, description: 'project-relative spec path, as listed by the specs command' },
    ],
    options: [],
  },
  tests: {
    description: 'list the tests of the active run and their state, or detail one by id',
    params: [
      { name: 'test', type: 'string', required: false, description: 'test id to detail (timings, error, full title); omit to list every test' },
    ],
    options: [
      { name: 'attempt', type: 'number', required: false, description: '1-based attempt to detail (attempt 1 = first run); defaults to the latest, requires a <test> id' },
    ],
  },
  commands: {
    description: 'list the command log entries of a test of the active run',
    params: [],
    options: [
      { name: 'test', type: 'string', required: true, description: 'test id, as listed by the tests command' },
      { name: 'attempt', type: 'number', required: false, description: '1-based attempt to read (attempt 1 = first run); defaults to the latest' },
    ],
  },
  pin: {
    description: 'pin a command’s DOM snapshot into the live app-under-test frame so the dom/aria/inspect commands can read it; pass --clear to release',
    params: [
      { name: 'test', type: 'string', required: false, description: 'test id, as listed by the tests command' },
      { name: 'command', type: 'string', required: false, description: 'command id, as listed by the commands command' },
    ],
    options: [
      { name: 'at', type: 'string', required: false, description: 'which snapshot to pin: a name like "before"/"after" or a 1-based index; defaults to the last (the command’s final state). Re-run on the pinned command to switch snapshots without releasing the pin' },
      { name: 'clear', type: 'boolean', required: false, description: 'release the current pin and restore the app to its pre-pin state' },
    ],
  },
  'run-state': {
    description: 'report where the running Cypress instance is in its run lifecycle',
    params: [],
    options: [],
    hidden: true,
  },
} as const satisfies Record<string, TapCommandMeta>

export type TapCommandName = keyof typeof TAP_COMMANDS

export const buildTapSchema = (cypressVersion: string): TapSchema => {
  const commands = (Object.keys(TAP_COMMANDS) as TapCommandName[]).map((name): TapCommandSchema => {
    const meta: TapCommandMeta = TAP_COMMANDS[name]

    return {
      name,
      description: meta.description,
      params: meta.params.map((param) => ({ ...param })),
      options: meta.options.map((option) => ({ ...option })),
      ...(meta.hidden ? { hidden: true } : {}),
    }
  })

  return {
    schemaVersion: TAP_SCHEMA_VERSION,
    cypressVersion,
    commands,
  }
}
