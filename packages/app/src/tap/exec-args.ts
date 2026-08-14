import { InvalidValueTapError, MissingArgumentsTapError, MissingOptionTapError, TapError, UnknownOptionTapError } from './contract'
import type { TapCommandOptionSchema, TapCommandParamSchema } from './contract'

type ExpectedType = TapCommandParamSchema['type']

type CoercedScalar =
  | { ok: true, value: string | number | boolean }
  | { ok: false, expected: string }

const coerceScalar = (type: ExpectedType, raw: string): CoercedScalar => {
  switch (type) {
    case 'number': {
      const value = Number(raw)

      if (raw.trim() === '' || Number.isNaN(value)) {
        return { ok: false, expected: 'a number' }
      }

      return { ok: true, value }
    }
    case 'boolean':
      if (raw !== 'true' && raw !== 'false') {
        return { ok: false, expected: 'true or false' }
      }

      return { ok: true, value: raw === 'true' }
    default:
      return { ok: true, value: raw }
  }
}

type CoercedField =
  | { ok: true, value: string | number | boolean }
  | CoercionFailure

// Coerce one raw wire value for a labeled field (`<param>` or `--option`). A value
// of the wrong type is the same failure whichever field carried it, so the
// positional and flag paths raise it as the one error.
const coerceField = (label: string, type: ExpectedType, raw: string): CoercedField => {
  if (typeof raw !== 'string') {
    return { ok: false, error: new InvalidValueTapError(label, 'a string', raw) }
  }

  const result = coerceScalar(type, raw)

  if (!result.ok) {
    return { ok: false, error: new InvalidValueTapError(label, result.expected, raw) }
  }

  return { ok: true, value: result.value }
}

/**
 * Coercion answers with the failure already raised, rather than with the pieces of
 * one: which condition an unusable input is — an unknown flag, a value of the wrong
 * type, a required argument left out — is known here and nowhere else.
 */
type CoercionFailure = { ok: false, error: TapError }

type CoercedCommandArgs =
  | { ok: true, args: Record<string, unknown> }
  | CoercionFailure

export const coerceCommandArgs = (name: string, params: readonly TapCommandParamSchema[], args: Record<string, string>): CoercedCommandArgs => {
  const invalid = (message: string): CoercedCommandArgs => {
    return { ok: false, error: new TapError('INVALID_ARGUMENTS', { detail: message }) }
  }

  const known = new Set(params.map(({ name: param }) => param))
  const unknown = Object.keys(args).find((key) => !known.has(key))

  if (unknown) {
    return invalid(`<${unknown}> was passed to "${name}", but it's not a supported argument of "${name}".`)
  }

  const missing = params.filter(({ required, name: param }) => required && args[param] === undefined)

  if (missing.length) {
    return { ok: false, error: new MissingArgumentsTapError(name, missing.map(({ name: param }) => param)) }
  }

  const coerced: Record<string, unknown> = {}

  for (const param of params) {
    const raw = args[param.name]

    if (raw === undefined) {
      continue
    }

    const result = coerceField(`<${param.name}>`, param.type, raw)

    if (!result.ok) {
      return result
    }

    coerced[param.name] = result.value
  }

  return { ok: true, args: coerced }
}

type CoercedCommandOptions =
  | { ok: true, options: Record<string, unknown> }
  | CoercionFailure

export const coerceCommandOptions = (name: string, options: readonly TapCommandOptionSchema[], raw: Record<string, string>): CoercedCommandOptions => {
  const known = new Set(options.map(({ name: option }) => option))
  const unknown = Object.keys(raw).find((key) => !known.has(key))

  // A flag this command has no such thing as, rather than one it has and was given
  // wrongly — the same condition the CLI answers before a call ever gets here.
  if (unknown) {
    return { ok: false, error: new UnknownOptionTapError(`--${unknown}`) }
  }

  const coerced: Record<string, unknown> = {}

  for (const option of options) {
    const supplied = raw[option.name]

    if (supplied === undefined) {
      if (option.required) {
        return { ok: false, error: new MissingOptionTapError(name, option.name) }
      }

      if (option.type === 'boolean') {
        coerced[option.name] = false
      }

      continue
    }

    const result = coerceField(`--${option.name}`, option.type, supplied)

    if (!result.ok) {
      return result
    }

    coerced[option.name] = result.value
  }

  return { ok: true, options: coerced }
}
