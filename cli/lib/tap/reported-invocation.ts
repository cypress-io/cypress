import { tapCliCommands } from './commands'
import { renderOptionsFor } from './render'
import type { TapCliOptions } from './types'
import { TAP_COMMANDS } from '@packages/cypress-instances'
import type { TapCommandOptionSchema } from '@packages/cypress-instances'

const allTapCommands = [...tapCliCommands, ...TAP_COMMANDS]

const knownCommands = new Set<string>(allTapCommands.map(({ name }) => name))

// A name this CLI does not know is whatever the user typed, so it is reported
// as unknown rather than sent verbatim.
const reportedCommand = (command: string | undefined): string | undefined => {
  if (!command) {
    return undefined
  }

  return knownCommands.has(command) ? command : 'unknown'
}

const declaredOptions: readonly TapCommandOptionSchema[] = allTapCommands.flatMap(({ name, options = [] }) => {
  return [...options, ...renderOptionsFor(name)]
})

// Both spellings of every option resolve to the canonical name, so `-b` and
// `--browser` report as one flag. The names seeded here belong to `cypress tap`
// itself rather than to any command, so `declaredOptions` does not carry them.
const knownFlags = new Map<string, string>([
  ...['instance', 'json', 'timeout', 'help'].map((name): [string, string] => [name, name]),
  ['h', 'help'],
  ...declaredOptions.flatMap(({ name, alias }): [string, string][] => alias ? [[name, name], [alias, name]] : [[name, name]]),
])

// Names only: an option's value carries selectors, spec paths and test titles.
// An undeclared flag is whatever the user typed, so it reports as unknown.
// --instance/--json/--timeout are parsed off by the outer `cypress tap` command
// and never reach the operands, so they are read from the options it passes on.
const reportedFlags = (operands: string[], options: TapCliOptions): string[] => {
  const named = operands
  .filter((operand) => operand.startsWith('-'))
  .map((operand) => knownFlags.get(operand.replace(/^-+/, '').split('=')[0]) ?? 'unknown')

  const topLevel = Object.entries(options)
  .filter(([name, value]) => value !== undefined && knownFlags.has(name))
  .map(([name]) => name)

  return [...new Set([...named, ...topLevel])]
}

export interface ReportedInvocation {
  command: string | undefined
  flags: string[]
}

/**
 * The fixed names a trace may carry, reduced from what the user actually typed.
 * Everything the tap CLI reports about an invocation passes through here, so no
 * selector, spec path, project root or option value can reach the wire.
 */
export const reportedInvocation = (command: string | undefined, operands: string[], options: TapCliOptions): ReportedInvocation => ({
  command: reportedCommand(command),
  flags: reportedFlags(operands, options),
})
