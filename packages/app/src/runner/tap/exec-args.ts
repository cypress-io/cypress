import type { TapCommandParamSchema } from './contract'

/**
 * How a command is written on the CLI, derived from its param schema —
 * e.g. `run <spec>` for one required param, `foo <bar> [baz]` with an
 * optional second.
 */
export const signatureOf = (name: string, params: TapCommandParamSchema[]): string => {
  return [name, ...params.map(({ name: param, required }) => required ? `<${param}>` : `[${param}]`)].join(' ')
}

const usageOf = (name: string, params: TapCommandParamSchema[]): string => {
  return `Usage: cypress tap ${signatureOf(name, params)}`
}

export type CoercedCommandArgs =
  | { ok: true, args: unknown[] }
  | { ok: false, message: string }

/**
 * Validate and coerce the raw string positionals of one `exec` invocation
 * against a command's param schema. Living app-side (not in the CLI) is the
 * point: the CLI forwards strings without interpreting param types, so a new
 * param type never strands older CLIs.
 */
export const coerceCommandArgs = (name: string, params: TapCommandParamSchema[], args: string[]): CoercedCommandArgs => {
  const invalid = (message: string): CoercedCommandArgs => {
    return { ok: false, message: `${message} ${usageOf(name, params)}` }
  }

  if (args.length > params.length) {
    return invalid(`"${name}" takes ${params.length} argument(s), but ${args.length} were given.`)
  }

  const missing = params.filter(({ required }, index) => required && args[index] === undefined)

  if (missing.length) {
    return invalid(`"${name}" is missing the required ${missing.map(({ name: param }) => `<${param}>`).join(' ')} argument(s).`)
  }

  const coerced: unknown[] = []

  for (const [index, raw] of args.entries()) {
    const param = params[index]

    if (typeof raw !== 'string') {
      return invalid(`<${param.name}> must be a string over the wire, but ${typeof raw} was given.`)
    }

    if (param.type === 'number') {
      const value = Number(raw)

      if (raw.trim() === '' || Number.isNaN(value)) {
        return invalid(`<${param.name}> must be a number, but "${raw}" was given.`)
      }

      coerced.push(value)
    } else if (param.type === 'boolean') {
      if (raw !== 'true' && raw !== 'false') {
        return invalid(`<${param.name}> must be true or false, but "${raw}" was given.`)
      }

      coerced.push(raw === 'true')
    } else {
      coerced.push(raw)
    }
  }

  return { ok: true, args: coerced }
}
