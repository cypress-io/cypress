import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand } from './definition'
import { MissingCompanionOptionTapError, TapError } from '../contract'
import { attemptSelectionError, selectTestAttempt, serializeReporterSpecView, serializeReporterView } from '../test-state'
import type { TapReporterSpecView, TapReporterView } from '../contract'

export const reporterCommand = defineCommand('reporter', async (_params, { 'test-id': test, attempt }): Promise<TapReporterView | TapReporterSpecView> => {
  // An invocation that could not work whatever the run is doing, so it is answered
  // before the run is consulted at all.
  if (test === undefined && attempt !== undefined) {
    throw new MissingCompanionOptionTapError('--attempt', '--test-id', 'Pass `--test-id` to specify the test, or omit `--attempt` to review the latest attempt for every test in the spec.')
  }

  const runner = tapManagerDataSource.getRunner()

  if (!runner) {
    throw new TapError('SPEC_NOT_STARTED')
  }

  if (test === undefined) {
    return serializeReporterSpecView(runner, tapManagerDataSource.getActiveSpecRelative())
  }

  const selection = selectTestAttempt(runner, test, attempt)

  if ('error' in selection) {
    throw attemptSelectionError(selection, test)
  }

  return serializeReporterView(selection.test, selection.attempt, runner.isRunComplete())
})
