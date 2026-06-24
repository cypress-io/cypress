import type { TapCommandDefinition } from './definition'
import { runCommand } from './run'
import { specsCommand } from './specs'
import { testsCommand } from './tests'

// The command registry — the single source of truth for the tap binding.
// Adding a subcommand is one sibling module plus its entry here.
export const tapCommands = {
  specs: specsCommand,
  run: runCommand,
  tests: testsCommand,
} satisfies Record<string, TapCommandDefinition>
