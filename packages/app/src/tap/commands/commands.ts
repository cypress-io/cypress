import { tapManagerDataSource } from '../TapManagerDataSource'
import { defineCommand, TapCommandError } from './definition'
import { serializeTestCommands } from './test-state'
import type { CommandEntry } from './test-state'

export const commandsCommand = defineCommand({
  description: 'list the command-log entries of a test of the active run',
  params: [],
  options: [
    { name: 'test', type: 'string', required: true, description: 'test id, as listed by the tests command' },
  ],
  handler: async (_params, { test }): Promise<CommandEntry[]> => {
    const runner = tapManagerDataSource.getRunner()

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
