import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand, TapCommandError } from './definition'
import { attemptSelectionError, selectTestAttempt, serializeTestCommands } from './test-state'
import type { CommandEntry } from '../types'

export const commandsCommand = defineCommand({
  description: 'list the command log entries of a test of the active run',
  params: [],
  options: [
    { name: 'test', type: 'string', required: true, description: 'test id, as listed by the tests command' },
    { name: 'attempt', type: 'number', required: false, description: '1-based attempt to read (attempt 1 = first run); defaults to the latest' },
  ],
  handler: async (_params, { test, attempt }): Promise<CommandEntry[]> => {
    const runner = tapManagerDataSource.getRunner()

    if (!runner) {
      throw new TapCommandError('NO_RUN', 'no spec has been run yet — use the run command to run a spec first')
    }

    const selection = selectTestAttempt(runner, test, attempt)

    if ('error' in selection) {
      throw attemptSelectionError(selection, test)
    }

    return serializeTestCommands(selection.attempt)
  },
})
