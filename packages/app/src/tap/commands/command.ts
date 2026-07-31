import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand, TapCommandError } from './definition'
import { attemptSelectionError, resolveCommand, selectTestAttempt } from '../test-state'
import type { CommandEntry, ConsolePropsResult } from '../types'

export const commandCommand = defineCommand('command', async (_params, options): Promise<CommandEntry | ConsolePropsResult> => {
  const { test, attempt, command, props } = options
  const fullReport = options['full-report']

  if (fullReport && !props) {
    throw new TapCommandError('PROPS_REQUIRED', 'pass --props with --full-report — only a command’s console properties are ever shortened')
  }

  const runner = tapManagerDataSource.getRunner()

  if (!runner) {
    throw new TapCommandError('NO_RUN', 'no spec has been run yet — use the run command to run a spec first')
  }

  const selection = selectTestAttempt(runner, test, attempt)

  if ('error' in selection) {
    throw attemptSelectionError(selection, test)
  }

  const resolved = resolveCommand(selection.attempt, command, test)

  if (!resolved) {
    throw new TapCommandError('COMMAND_NOT_FOUND', `no command of this test matches the id "${command}" — use the reporter command (with --test) to list this test’s commands`)
  }

  if (!props) {
    return resolved.entry
  }

  const consoleProps = runner.getSerializedConsolePropsForLog(test, resolved.logId, fullReport ? { fullReport } : undefined)

  if (!consoleProps || Object.keys(consoleProps).length === 0) {
    throw new TapCommandError('CONSOLE_PROPS_UNAVAILABLE', 'this command has no console properties available — command details are captured in open mode and kept only for the most recent tests (numTestsKeptInMemory)')
  }

  return consoleProps
})
