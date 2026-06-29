import type { HealthResult, TapCommandOptionSchema, TapCommandParamSchema } from './contract'

// Limits the input types
type ScalarOf<T> = T extends 'string' ? string : T extends 'number' ? number : boolean

// Maps the schema to an object type for the handler (params)
type ParamsToObject<P extends readonly TapCommandParamSchema[]> =
  { [E in P[number] as E extends { required: true } ? E['name'] : never]: ScalarOf<E['type']> } &
  { [E in P[number] as E extends { required: true } ? never : E['name']]?: ScalarOf<E['type']> }

// Maps the schema to an object type for the handler (options)
type OptionsToObject<O extends readonly TapCommandOptionSchema[]> =
  { [E in O[number] as E extends { required: true } | { type: 'boolean' } ? E['name'] : never]: ScalarOf<E['type']> } &
  { [E in O[number] as E extends { required: true } | { type: 'boolean' } ? never : E['name']]?: ScalarOf<E['type']> }

// Function that provides type-safe command definitions
const defineCommand = <
  const P extends readonly TapCommandParamSchema[],
  const O extends readonly TapCommandOptionSchema[] = [],
>(definition: {
  description: string
  params: P
  options?: O
  handler: (params: ParamsToObject<P>, options: OptionsToObject<O>) => Promise<unknown>
}) => {
  return definition
}

export interface TapCommandDefinition {
  description: string
  params: readonly TapCommandParamSchema[]
  options?: readonly TapCommandOptionSchema[]
  handler: (...args: any[]) => Promise<unknown>
}

export const tapCommands = {
  // Example command to be removed
  health: defineCommand({
    description: 'check that a running Cypress instance is reachable and its tap binding responds',
    params: [],
    handler: async (): Promise<HealthResult> => 'ok',
  }),
}
