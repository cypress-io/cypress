import type { TapCommandOptionSchema, TapCommandParamSchema } from './contract'

/**
 * How a command is written on the CLI, derived from its param schema —
 * e.g. `run <spec>` for one required param, `foo <bar> [baz]` with an
 * optional second. A command that takes options gets a trailing `[options]`.
 */
const signatureOf = (name: string, params: readonly TapCommandParamSchema[], options: readonly TapCommandOptionSchema[] = []): string => {
  const parts = [name, ...params.map(({ name: param, required }) => required ? `<${param}>` : `[${param}]`)]

  if (options.length) {
    parts.push('[options]')
  }

  return parts.join(' ')
}

const usageOf = (name: string, params: readonly TapCommandParamSchema[], options: readonly TapCommandOptionSchema[] = []): string => {
  return `Usage: cypress tap ${signatureOf(name, params, options)}`
}

type WireType = TapCommandParamSchema['type']

type CoercedScalar =
  | { ok: true, value: string | number | boolean }
  | { ok: false, reason: string }

/**
 * Coerce one raw wire string to a declared type, or explain why it cannot.
 * Callers own the label (`<param>` vs `--option`) and stitch the reason into
 * a `<label> must be <reason>.` message, so the type rules live in one place.
 */
const coerceScalar = (type: WireType, raw: string): CoercedScalar => {
  if (type === 'number') {
    const value = Number(raw)

    if (raw.trim() === '' || Number.isNaN(value)) {
      return { ok: false, reason: `a number, but "${raw}" was given` }
    }

    return { ok: true, value }
  }

  if (type === 'boolean') {
    if (raw !== 'true' && raw !== 'false') {
      return { ok: false, reason: `true or false, but "${raw}" was given` }
    }

    return { ok: true, value: raw === 'true' }
  }

  return { ok: true, value: raw }
}

type CoercedCommandArgs =
  | { ok: true, args: Record<string, unknown> }
  | { ok: false, message: string }

/**
 * Validate and coerce the raw string args of one `exec` invocation against a
 * command's param schema — the positional counterpart to
 * `coerceCommandOptions`. Args arrive keyed by param name (the CLI keys
 * positionals by their schema name before forwarding), so this reads each by
 * name rather than by index. Living app-side (not in the CLI) is the point:
 * the CLI forwards strings without interpreting param types, so a new param
 * type never strands older CLIs.
 */
export const coerceCommandArgs = (name: string, params: readonly TapCommandParamSchema[], args: Record<string, string>, options: readonly TapCommandOptionSchema[] = []): CoercedCommandArgs => {
  const invalid = (message: string): CoercedCommandArgs => {
    return { ok: false, message: `${message} ${usageOf(name, params, options)}` }
  }

  // The CLI rejects excess positionals at parse time, but the wire is wire:
  // reject any arg the schema doesn't name, exactly as options do.
  const known = new Set(params.map(({ name: param }) => param))
  const unknown = Object.keys(args).find((key) => !known.has(key))

  if (unknown) {
    return invalid(`"${name}" has no <${unknown}> argument.`)
  }

  const missing = params.filter(({ required, name: param }) => required && args[param] === undefined)

  if (missing.length) {
    return invalid(`"${name}" is missing the required ${missing.map(({ name: param }) => `<${param}>`).join(' ')} argument(s).`)
  }

  const coerced: Record<string, unknown> = {}

  for (const param of params) {
    const raw = args[param.name]

    if (raw === undefined) {
      // An absent optional param leaves its key off, so a handler sees
      // `undefined` — the positional twin of an omitted value option.
      continue
    }

    if (typeof raw !== 'string') {
      return invalid(`<${param.name}> must be a string over the wire, but ${typeof raw} was given.`)
    }

    const result = coerceScalar(param.type, raw)

    if (!result.ok) {
      return invalid(`<${param.name}> must be ${result.reason}.`)
    }

    coerced[param.name] = result.value
  }

  return { ok: true, args: coerced }
}

type CoercedCommandOptions =
  | { ok: true, options: Record<string, unknown> }
  | { ok: false, message: string }

/**
 * Validate and coerce the raw option values of one `exec` invocation against
 * a command's option schema — the flag counterpart to `coerceCommandArgs`.
 * The CLI forwards each `--flag value` as a raw string (and each present
 * boolean flag as `"true"`), so coercion to the declared type happens here.
 * Absent boolean flags resolve to `false`; absent value options are omitted,
 * so a handler sees `undefined`. `params` is taken only to render the same
 * usage line positional errors use.
 */
export const coerceCommandOptions = (name: string, params: readonly TapCommandParamSchema[], options: readonly TapCommandOptionSchema[], raw: Record<string, string>): CoercedCommandOptions => {
  const invalid = (message: string): CoercedCommandOptions => {
    return { ok: false, message: `${message} ${usageOf(name, params, options)}` }
  }

  const known = new Set(options.map(({ name: option }) => option))
  const unknown = Object.keys(raw).find((key) => !known.has(key))

  if (unknown) {
    return invalid(`"${name}" has no --${unknown} option.`)
  }

  const coerced: Record<string, unknown> = {}

  for (const option of options) {
    const supplied = raw[option.name]

    if (supplied === undefined) {
      if (option.required) {
        return invalid(`"${name}" is missing the required --${option.name} option.`)
      }

      // Boolean flags default to off; value options stay absent (undefined).
      if (option.type === 'boolean') {
        coerced[option.name] = false
      }

      continue
    }

    if (typeof supplied !== 'string') {
      return invalid(`--${option.name} must be a string over the wire, but ${typeof supplied} was given.`)
    }

    const result = coerceScalar(option.type, supplied)

    if (!result.ok) {
      return invalid(`--${option.name} must be ${result.reason}.`)
    }

    coerced[option.name] = result.value
  }

  return { ok: true, options: coerced }
}
