import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand, TapCommandError } from './definition'
import { attemptSelectionError, selectTestAttempt, serializeTestDetail, serializeTestsState } from './test-state'
import type { TapTestsRunner, TestDetailEntry, TestStateEntry } from '../types'

const listTests = (runner: TapTestsRunner, attempt?: number): TestStateEntry[] => {
  if (attempt !== undefined) {
    throw new TapCommandError('ATTEMPT_NOT_FOUND', 'the --attempt option applies only when detailing a single test; pass a <test> id')
  }

  return serializeTestsState(runner)
}

const detailTest = (runner: TapTestsRunner, testId: string, attempt?: number): TestDetailEntry => {
  const selection = selectTestAttempt(runner, testId, attempt)

  if ('error' in selection) {
    throw attemptSelectionError(selection, testId)
  }

  return serializeTestDetail(selection.test, selection.attempt, runner.isRunComplete())
}

export const testsCommand = defineCommand({
  description: 'list the tests of the active run and their state, or detail one by id',
  params: [
    { name: 'test', type: 'string', required: false, description: 'test id to detail (timings, error, full title); omit to list every test' },
  ],
  options: [
    { name: 'attempt', type: 'number', required: false, description: '1-based attempt to detail (attempt 1 = first run); defaults to the latest, requires a <test> id' },
  ],
  handler: async ({ test }, { attempt }): Promise<TestStateEntry[] | TestDetailEntry> => {
    const runner = tapManagerDataSource.getRunner()

    if (!runner) {
      throw new TapCommandError('NO_RUN', 'no spec has been run yet — use the run command to run a spec first')
    }

    return test === undefined
      ? listTests(runner, attempt)
      : detailTest(runner, test, attempt)
  },
})
