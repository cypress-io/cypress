import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand, TapCommandError } from './definition'
import { attemptSelectionError, selectTestAttempt, serializeTestCommands } from '../test-state'
import type { CommandEntry, ConsolePropsResult } from '../types'

export const commandsCommand = defineCommand('commands', async (_params, { test, attempt, command, props }): Promise<CommandEntry[] | CommandEntry | ConsolePropsResult> => {
  if (props && command === undefined) {
    throw new TapCommandError('COMMAND_REQUIRED', 'pass --command <id> with --props — omit both options to list this test’s commands')
  }

  const runner = tapManagerDataSource.getRunner()

  if (!runner) {
    throw new TapCommandError('NO_RUN', 'no spec has been run yet — use the run command to run a spec first')
  }

  const selection = selectTestAttempt(runner, test, attempt)

  if ('error' in selection) {
    throw attemptSelectionError(selection, test)
  }

  const commands = serializeTestCommands(selection.attempt)

  if (command === undefined) {
    return commands
  }

  const selected = commands.find((entry) => entry.id === command)

  if (!selected) {
    throw new TapCommandError('COMMAND_NOT_FOUND', `no command of this test matches the id "${command}" — omit --command to list this test’s commands`)
  }

  if (!props) {
    return selected
  }

  const consoleProps = runner.getSerializedConsolePropsForLog(test, command)

  if (!consoleProps || Object.keys(consoleProps).length === 0) {
    throw new TapCommandError('CONSOLE_PROPS_UNAVAILABLE', 'this command has no console properties available — command details are captured in open mode and kept only for the most recent tests (numTestsKeptInMemory)')
  }

  return consoleProps
})
