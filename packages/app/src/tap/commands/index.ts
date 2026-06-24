import type { TapCommandDefinition } from './definition'

/**
 * The command registry — the single source of truth for the tap binding.
 * `getSchema()` serializes the metadata and `TapManager.exec` dispatches by
 * name, so adding a subcommand is one sibling module (definition, result
 * types, any seam it needs) plus its entry here. The registry ships empty;
 * the first real command lands with the `specs` module.
 */
export const tapCommands: Record<string, TapCommandDefinition> = {}
