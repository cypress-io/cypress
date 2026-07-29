import { commandCommand } from './command'
import { commandsCommand } from './commands'
import type { TapCommandDefinition } from './definition'
import { pinCommand } from './pin'
import { runCommand } from './run'
import { runStateCommand } from './run-state'
import { specsCommand } from './specs'
import { testsCommand } from './tests'
import type { TapCommandName } from '../contract'

// The command registry — the single source of truth for the tap binding.
// Adding a subcommand is one sibling module plus its entry here. Keyed by
// `TapCommandName`, each slot demanding a definition authored for that same
// name, so the registry, the contract, and each `defineCommand` call can't
// drift: a missing command or a key/name mismatch fails to compile.
export const tapCommands: { [K in TapCommandName]: TapCommandDefinition & { name: K } } = {
  specs: specsCommand,
  run: runCommand,
  tests: testsCommand,
  commands: commandsCommand,
  command: commandCommand,
  pin: pinCommand,
  'run-state': runStateCommand,
}
