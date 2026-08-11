import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand } from './definition'
import { TapError } from '../contract'
import { attemptSelectionError, liveSnapshots, resolveCommand, selectTestAttempt, serializeCommandSnapshots } from '../test-state'
import { omitNullish } from '../utils'
import type { CommandResult, ConsolePropsResult } from '../types'

// The driver returns `{}` for a log it holds no properties for; the contract
// reports that as no console properties rather than an empty payload. The
// envelope's `snapshot` goes the same way: it is a note about what the app's
// console panel is showing ("Displaying current state of the DOM"), not
// something the command logged, and `snapshots` on the result already reports
// the row's real ones.
const consolePropsOf = (props: ConsolePropsResult | undefined): ConsolePropsResult | undefined => {
  if (!props) {
    return undefined
  }

  const reported = Object.fromEntries(Object.entries(props).filter(([key]) => key !== 'snapshot'))

  return Object.keys(reported).length ? reported : undefined
}

export const commandCommand = defineCommand('command', async (_params, options): Promise<CommandResult> => {
  const { 'test-id': test, attempt, 'command-id': command, json } = options

  const runner = tapManagerDataSource.getRunner()

  if (!runner) {
    throw new TapError('NO_RUN')
  }

  const selection = selectTestAttempt(runner, test, attempt)

  if ('error' in selection) {
    throw attemptSelectionError(selection, test)
  }

  // The per-log lookups are keyed by the driver's own log id, and the displayed
  // row number resolves to it under the reporter's numbering rules — the test
  // body wins a duplicated number, `h1:3` targets a hook's row.
  const resolved = resolveCommand(selection.attempt, command, test)

  if (!resolved) {
    throw new TapError('COMMAND_NOT_FOUND', { detail: `Looked for "${command}".` })
  }

  const snapshotProps = tapManagerDataSource.getSnapshotRunner()?.getSnapshotPropsForLog(test, resolved.logId)

  return omitNullish<CommandResult>({
    ...resolved.entry,
    snapshots: serializeCommandSnapshots(liveSnapshots(snapshotProps)),
    consoleProps: consolePropsOf(runner.getSerializedConsolePropsForLog(test, resolved.logId, json ? { full: true } : undefined)),
  })
})
