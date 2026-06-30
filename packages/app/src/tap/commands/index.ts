import type { TapCommandDefinition } from './definition'

// The command registry — the single source of truth for the tap binding.
// Adding a subcommand is one sibling module plus its entry here. Ships empty;
// the first real command lands with the `specs` module.
export const tapCommands: Record<string, TapCommandDefinition> = {}
