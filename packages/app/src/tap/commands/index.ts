import { commandsCommand } from './commands'
import type { TapCommandDefinition } from './definition'
import { pinCommand } from './pin'
import { runCommand } from './run'
import { runStateCommand } from './run-state'
import { specsCommand } from './specs'
import { testsCommand } from './tests'

// The command registry — the single source of truth for the tap binding.
// Adding a subcommand is one sibling module plus its entry here.
export const tapCommands = {
  specs: specsCommand,
  run: runCommand,
  tests: testsCommand,
  commands: commandsCommand,
  pin: pinCommand,
  'run-state': runStateCommand,
} satisfies Record<string, TapCommandDefinition>
