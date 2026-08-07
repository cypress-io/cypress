import type { TapCliOptions } from './types'
import { KNOWN_COMMANDS, KNOWN_FLAGS } from '@packages/cypress-instances'

// A name this CLI does not know is whatever the user typed, so it is reported
// as unknown rather than sent verbatim.
const reportedCommand = (command: string | undefined): string | undefined => {
  if (!command) {
    return undefined
  }

  return KNOWN_COMMANDS.has(command) ? command : 'unknown'
}

// Names only: an option's value carries selectors, spec paths and test titles.
// An undeclared flag is whatever the user typed, so it reports as unknown.
// --instance/--json/--timeout are parsed off by the outer `cypress tap` command
// and never reach the operands, so they are read from the options it passes on.
const reportedFlags = (operands: string[], options: TapCliOptions): string[] => {
  const named = operands
  .filter((operand) => operand.startsWith('-'))
  .map((operand) => KNOWN_FLAGS.get(operand.replace(/^-+/, '').split('=')[0]) ?? 'unknown')

  const topLevel = Object.entries(options)
  .filter(([name, value]) => value !== undefined && KNOWN_FLAGS.has(name))
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
