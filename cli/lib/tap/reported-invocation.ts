import type { TapCliOptions } from './types'
import type { TapCommandName, TapNativeCommandName } from '@packages/cypress-sessions'
import { KNOWN_COMMANDS } from '@packages/cypress-sessions'

type ReportedCommand = TapNativeCommandName | TapCommandName | 'unknown'

// A name this CLI does not know is whatever the user typed, so it is reported
// as unknown rather than sent verbatim.
const getKnownCommand = (command: string): ReportedCommand => KNOWN_COMMANDS.has(command) ? command as ReportedCommand : 'unknown'

export interface ReportedInvocation {
  command: ReportedCommand | undefined
  flags: string[]
}

/**
 * What an invocation reports before it runs: the command it named, and the flags
 * `cypress tap` handles itself rather than passing to a command. The flags a
 * command declares are reported once commander has parsed them, by noteTapCommand.
 */
export const reportedInvocation = (command: string | undefined, wantsHelp: boolean, options: TapCliOptions): ReportedInvocation => ({
  command: command ? getKnownCommand(command) : undefined,
  flags: [
    ...wantsHelp ? ['help'] : [],
    ...Object.keys(options),
  ],
})
