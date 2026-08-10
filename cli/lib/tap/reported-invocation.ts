import type { TapCliOptions } from './types'
import { KNOWN_COMMANDS } from '@packages/cypress-instances'

// A name this CLI does not know is whatever the user typed, so it is reported
// as unknown rather than sent verbatim.
const reportedCommand = (command: string | undefined): string | undefined => {
  if (!command) {
    return undefined
  }

  return KNOWN_COMMANDS.has(command) ? command : 'unknown'
}

export interface ReportedInvocation {
  command: string | undefined
  flags: string[]
}

/**
 * What an invocation reports before it runs: the command it named, and the flags
 * `cypress tap` handles itself rather than passing to a command. The flags a
 * command declares are reported once commander has parsed them, by noteTapCommand.
 */
export const reportedInvocation = (command: string | undefined, wantsHelp: boolean, options: TapCliOptions): ReportedInvocation => ({
  command: reportedCommand(command),
  flags: [
    ...wantsHelp ? ['help'] : [],
    ...Object.entries(options).filter(([, value]) => value !== undefined).map(([name]) => name),
  ],
})
