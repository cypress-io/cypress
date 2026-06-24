import type { TapCommandOptionSchema, TapCommandParamSchema } from '../contract'

/**
 * The sanctioned way for a handler to report a domain failure: a command that
 * ran but could not do what was asked (no run mounted yet, no test with that
 * id, no spec at that path). `exec` catches it and turns it into an
 * `{ ok: false, code, message }` envelope, so the CLI renders the message on
 * stderr and exits non-zero — the same path dispatch failures take. The `code`
 * is command-defined (e.g. `NO_RUN`, `TEST_NOT_FOUND`) and is NOT enumerated in
 * the frozen contract, exactly as per-command result shapes are not.
 *
 * This is distinct from any other throw: an unexpected throw still escapes
 * `exec` and is treated by callers as a binding bug, never a domain result.
 */
export class TapCommandError extends Error {
  code: string

  constructor (code: string, message: string) {
    super(message)
    this.name = 'TapCommandError'
    this.code = code
  }
}

/**
 * The TS type one wire `type` coerces to (see `../exec-args`).
 */
type ScalarOf<T> = T extends 'string' ? string : T extends 'number' ? number : boolean

/**
 * A command's positional params mapped to the object its handler receives,
 * keyed by param name — the positional counterpart to `OptionsToObject`. A
 * required param is always present; a non-required one may be absent on the
 * wire, so its key is optional and a handler sees `undefined`. So
 * `[{ name: 'spec', type: 'string', required: true }]` becomes `{ spec: string }`.
 */
type ParamsToObject<P extends readonly TapCommandParamSchema[]> =
  { [E in P[number] as E extends { required: true } ? E['name'] : never]: ScalarOf<E['type']> } &
  { [E in P[number] as E extends { required: true } ? never : E['name']]?: ScalarOf<E['type']> }

/**
 * A command's options mapped to the trailing object its handler receives,
 * keyed by option name. Coercion always materializes required and boolean
 * options (an absent flag defaults to `false`), so those keys are present;
 * an absent non-required value option is omitted, so those keys are optional
 * and a handler sees `undefined`.
 */
type OptionsToObject<O extends readonly TapCommandOptionSchema[]> =
  { [E in O[number] as E extends { required: true } | { type: 'boolean' } ? E['name'] : never]: ScalarOf<E['type']> } &
  { [E in O[number] as E extends { required: true } | { type: 'boolean' } ? never : E['name']]?: ScalarOf<E['type']> }

/**
 * Authoring helper for one `cypress tap` subcommand: the metadata
 * `getSchema()` advertises to the CLI plus the handler `exec` dispatches to.
 * It captures `params`/`options` as literal types (via `const` type params)
 * and derives the handler signature from them, so the handler is type-checked
 * against its own schema with no annotations — a required `{ name: 'spec',
 * type: 'string' }` param gives `params.spec` as `string`. Handlers receive
 * an object of the coerced positionals keyed by param name, then an object of
 * the coerced options keyed by option name (absent boolean flags are `false`,
 * absent value options are omitted) — e.g. `handler: async ({ spec }, { headed
 * }) => …`. Everything a handler takes or returns must be JSON-serializable
 * per `../contract` — result types live with their command, but the round-trip
 * rule binds them all the same. `options` defaults to none, and a handler may
 * ignore the trailing options object entirely.
 */
export const defineCommand = <
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

/**
 * The erased view of a command the dispatcher reads through: positionals and
 * options arrive as coerced `unknown`s from the wire, so the handler must be
 * opaque here even though `defineCommand` types each entry precisely for
 * authoring. `TapManager` annotates looked-up entries with this shape.
 */
export interface TapCommandDefinition {
  description: string
  params: readonly TapCommandParamSchema[]
  options?: readonly TapCommandOptionSchema[]
  handler: (...args: any[]) => Promise<unknown>
}
