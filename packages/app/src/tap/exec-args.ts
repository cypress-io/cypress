import type { TapCommandOptionSchema, TapCommandParamSchema } from './contract'

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

type ExpectedType = TapCommandParamSchema['type']

type CoercedScalar =
  | { ok: true, value: string | number | boolean }
  | { ok: false, reason: string }

const coerceScalar = (type: ExpectedType, raw: string): CoercedScalar => {
  switch (type) {
    case 'number': {
      const value = Number(raw)

      if (raw.trim() === '' || Number.isNaN(value)) {
        return { ok: false, reason: `a number, but "${raw}" was given` }
      }

      return { ok: true, value }
    }
    case 'boolean':
      if (raw !== 'true' && raw !== 'false') {
        return { ok: false, reason: `true or false, but "${raw}" was given` }
      }

      return { ok: true, value: raw === 'true' }
    default:
      return { ok: true, value: raw }
  }
}

type CoercedField =
  | { ok: true, value: string | number | boolean }
  | { ok: false, message: string }

// Coerce one raw wire value for a labeled field (`<param>` or `--option`),
// returning a ready-to-render message on failure so the positional and flag
// paths format identical errors from one place.
const coerceField = (label: string, type: ExpectedType, raw: string): CoercedField => {
  if (typeof raw !== 'string') {
    return { ok: false, message: `${label} must be a string, but ${typeof raw} was given.` }
  }

  const result = coerceScalar(type, raw)

  if (!result.ok) {
    return { ok: false, message: `${label} must be ${result.reason}.` }
  }

  return { ok: true, value: result.value }
}

type CoercedCommandArgs =
  | { ok: true, args: Record<string, unknown> }
  | { ok: false, message: string }

export const coerceCommandArgs = (name: string, params: readonly TapCommandParamSchema[], args: Record<string, string>, options: readonly TapCommandOptionSchema[] = []): CoercedCommandArgs => {
  const invalid = (message: string): CoercedCommandArgs => {
    return { ok: false, message: `${message} ${usageOf(name, params, options)}` }
  }

  const known = new Set(params.map(({ name: param }) => param))
  const unknown = Object.keys(args).find((key) => !known.has(key))

  if (unknown) {
    return invalid(`<${unknown}> was passed to "${name}", but it's not a supported argument of "${name}".`)
  }

  const missing = params.filter(({ required, name: param }) => required && args[param] === undefined)

  if (missing.length) {
    return invalid(`"${name}" is missing the required ${missing.map(({ name: param }) => `<${param}>`).join(' ')} argument(s).`)
  }

  const coerced: Record<string, unknown> = {}

  for (const param of params) {
    const raw = args[param.name]

    if (raw === undefined) {
      continue
    }

    const result = coerceField(`<${param.name}>`, param.type, raw)

    if (!result.ok) {
      return invalid(result.message)
    }

    coerced[param.name] = result.value
  }

  return { ok: true, args: coerced }
}

type CoercedCommandOptions =
  | { ok: true, options: Record<string, unknown> }
  | { ok: false, message: string }

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

      if (option.type === 'boolean') {
        coerced[option.name] = false
      }

      continue
    }

    const result = coerceField(`--${option.name}`, option.type, supplied)

    if (!result.ok) {
      return invalid(result.message)
    }

    coerced[option.name] = result.value
  }

  return { ok: true, options: coerced }
}
