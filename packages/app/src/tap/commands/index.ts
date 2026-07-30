import { commandCommand } from './command'
import type { TapCommandDefinition } from './definition'
import { pinCommand } from './pin'
import { reporterCommand } from './reporter'
import { runStateCommand } from './run-state'
import type { TapCommandName } from '../contract'

// The command registry — the single source of truth for the tap binding.
// Adding a subcommand is one sibling module plus its entry here. Keyed by
// `TapCommandName`, each slot demanding a definition authored for that same
// name, so the registry, the contract, and each `defineCommand` call can't
// drift: a missing command or a key/name mismatch fails to compile.
export const tapCommands: { [K in TapCommandName]: TapCommandDefinition & { name: K } } = {
  command: commandCommand,
  reporter: reporterCommand,
  pin: pinCommand,
  'run-state': runStateCommand,
}
