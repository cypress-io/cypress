import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand, noRunError, TapCommandError } from './definition'
import { attemptSelectionError, selectTestAttempt, serializeReporterSpecView, serializeReporterView } from '../test-state'
import type { TapReporterSpecView, TapReporterView } from '../contract'

export const reporterCommand = defineCommand('reporter', async (_params, { testId: test, attempt }): Promise<TapReporterView | TapReporterSpecView> => {
  const runner = tapManagerDataSource.getRunner()

  if (!runner) {
    throw noRunError()
  }

  if (test === undefined) {
    if (attempt !== undefined) {
      throw new TapCommandError('ATTEMPT_NOT_FOUND', 'the --attempt option applies only when rendering a single test; pass --testId <id>')
    }

    return serializeReporterSpecView(runner, tapManagerDataSource.getActiveSpecRelative())
  }

  const selection = selectTestAttempt(runner, test, attempt)

  if ('error' in selection) {
    throw attemptSelectionError(selection, test)
  }

  return serializeReporterView(selection.test, selection.attempt, runner.isRunComplete())
})
