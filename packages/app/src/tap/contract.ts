// Internal negotiation signal handed to the CLI via getSchema so it can refuse
// a Cypress whose tap contract it doesn't understand. It is deliberately kept
// out of the public `cli/types` surface — nothing user-facing should expose it.
export const TAP_SCHEMA_VERSION = 1

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

interface TapCommandSchema {
  name: string
  description: string
  params: readonly TapCommandParamSchema[]
  options: readonly TapCommandOptionSchema[]
}

export interface TapSchema {
  schemaVersion: typeof TAP_SCHEMA_VERSION
  cypressVersion: string
  commands: TapCommandSchema[]
}

// UNKNOWN_COMMAND   – the command isn't in the registry
// INVALID_PAYLOAD   – the args/options payload wasn't an object (or absent)
// INVALID_ARGUMENTS – a positional argument failed schema validation
// INVALID_OPTIONS   – a flag failed schema validation
type TapExecFailureCode = 'UNKNOWN_COMMAND' | 'INVALID_PAYLOAD' | 'INVALID_ARGUMENTS' | 'INVALID_OPTIONS'

export type TapExecResult =
  | { result: unknown }
  | { error: { code: TapExecFailureCode, message: string } }

export interface TapBindingContract {
  getSchema (): Promise<TapSchema>
  exec (command: string, args?: Record<string, string>, options?: Record<string, string>): Promise<TapExecResult>
}
