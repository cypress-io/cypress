import { defineCommand, TapCommandError } from './definition'
import { serializeTestCommands, tapRunnerSource } from './test-state'
import type { CommandEntry } from './test-state'

export const commandsCommand = defineCommand({
  description: 'list the command-log entries of a test of the active run',
  params: [],
  options: [
    { name: 'test', type: 'string', required: true, description: 'test id, as listed by the tests command' },
  ],
  // Returns just the test's command-log entries. A known test that has not run
  // yet has no log, which is an empty array — not a failure. The two failure
  // cases throw: NO_RUN when no spec has mounted a runner, TEST_NOT_FOUND when
  // the run holds no test with that id — both surface on stderr, never stdout.
  handler: async (_params, { test }): Promise<CommandEntry[]> => {
    const runner = tapRunnerSource.getRunner()

    if (!runner) {
      throw new TapCommandError('NO_RUN', 'no spec has been run yet — use the run command to run a spec first')
    }

    const commands = serializeTestCommands(runner, test)

    if (commands === undefined) {
      throw new TapCommandError('TEST_NOT_FOUND', `no test of this run matches the id "${test}" — use the tests command to list this run’s tests`)
    }

    return commands
  },
})
