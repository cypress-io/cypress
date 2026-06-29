export const TAP_BINDING_GLOBAL = '__CYPRESS_TAP_BINDING__'

export const TAP_SCHEMA_METHOD = 'getSchema'

export const TAP_EXEC_METHOD = 'exec'

export const TAP_PROTOCOL_VERSION = 1

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
  protocolVersion: number
  cypressVersion: string
  commands: TapCommandSchema[]
}

export type TapExecResult =
  | { ok: true, result: unknown }
  | { ok: false, code: string, message: string }
