import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand, TapCommandError } from './definition'
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
  const { test, attempt, command } = options
  const fullReport = options['full-report']

  const runner = tapManagerDataSource.getRunner()

  if (!runner) {
    throw new TapCommandError('NO_RUN', 'no spec has been run yet — use the run command to run a spec first')
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
    throw new TapCommandError('COMMAND_NOT_FOUND', `no command of this test matches the id "${command}" — use the reporter command (with --test) to list this test’s commands`)
  }

  const snapshotProps = tapManagerDataSource.getSnapshotRunner()?.getSnapshotPropsForLog(test, resolved.logId)

  return omitNullish<CommandResult>({
    ...resolved.entry,
    snapshots: serializeCommandSnapshots(liveSnapshots(snapshotProps)),
    consoleProps: consolePropsOf(runner.getSerializedConsolePropsForLog(test, resolved.logId, fullReport ? { fullReport } : undefined)),
  })
})
