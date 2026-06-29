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
  protocolVersion: typeof TAP_PROTOCOL_VERSION
  cypressVersion: string
  commands: TapCommandSchema[]
}

type TapExecFailureCode = 'UNKNOWN_COMMAND' | 'INVALID_ARGUMENTS'

export type TapExecResult =
  | { ok: true, result: unknown }
  | { ok: false, code: TapExecFailureCode, message: string }

export type HealthResult = 'ok'

export interface TapBindingContract {
  getSchema (): Promise<TapSchema>
  exec (command: string, args?: Record<string, string>, options?: Record<string, string>): Promise<TapExecResult>
}
