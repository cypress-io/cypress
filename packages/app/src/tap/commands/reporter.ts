import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand, TapCommandError } from './definition'
import { attemptSelectionError, selectTestAttempt, serializeReporterView } from '../test-state'
import type { TapReporterView } from '../contract'

export const reporterCommand = defineCommand('reporter', async (_params, { test, attempt }): Promise<TapReporterView> => {
  const runner = tapManagerDataSource.getRunner()

  if (!runner) {
    throw new TapCommandError('NO_RUN', 'no spec has been run yet — use the run command to run a spec first')
  }

  const selection = selectTestAttempt(runner, test, attempt)

  if ('error' in selection) {
    throw attemptSelectionError(selection, test)
  }

  return serializeReporterView(selection.test, selection.attempt, runner.isRunComplete())
})
