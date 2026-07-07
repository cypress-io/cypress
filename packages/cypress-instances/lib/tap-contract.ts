// Cross-process tap contract shared by the app (producer of the binding) and the
// CLI (consumer). Every value crosses CDP via JSON, so this is pure data: types
// and constants only, no imports. Argument coercion happens app-side so any CLI
// version can drive any Cypress version.

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

interface TapCommandSchema {
  name: string
  description: string
  params: readonly TapCommandParamSchema[]
  options: readonly TapCommandOptionSchema[]
}

export interface TapSchema {
  schemaVersion: number
  cypressVersion: string
  commands: TapCommandSchema[]
}

export type TapExecResult =
  | { result: unknown }
  | { error: { code: string, message: string } }
