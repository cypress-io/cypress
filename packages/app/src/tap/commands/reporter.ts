import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand } from './definition'
import { TapError } from '../contract'
import { attemptSelectionError, selectTestAttempt, serializeReporterSpecView, serializeReporterView } from '../test-state'
import type { TapReporterSpecView, TapReporterView } from '../contract'

export const reporterCommand = defineCommand('reporter', async (_params, { 'test-id': test, attempt }): Promise<TapReporterView | TapReporterSpecView> => {
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
