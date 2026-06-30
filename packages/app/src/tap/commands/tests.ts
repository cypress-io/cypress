import { defineCommand, TapCommandError } from './definition'
import { serializeTestDetail, serializeTestsState, tapRunnerSource } from './test-state'
import type { TestDetailEntry, TestStateEntry } from './test-state'

export const testsCommand = defineCommand({
  description: 'list the tests of the active run and their state, or detail one by id',
  params: [
    { name: 'test', type: 'string', required: false, description: 'test id to detail (timings, error, full title); omit to list every test' },
  ],
  handler: async ({ test }): Promise<TestStateEntry[] | TestDetailEntry> => {
    const runner = tapRunnerSource.getRunner()

    if (!runner) {
      throw new TapCommandError('NO_RUN', 'no spec has been run yet — use the run command to run a spec first')
    }

    if (test === undefined) {
      return serializeTestsState(runner)
    }

    const detail = serializeTestDetail(runner, test)

    if (detail === undefined) {
      throw new TapCommandError('TEST_NOT_FOUND', `no test of this run matches the id "${test}" — use the tests command to list this run’s tests`)
    }

    return detail
  },
})
