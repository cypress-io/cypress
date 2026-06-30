import { defineCommand } from './definition'
import { readRunModeSpecs, toSpecListEntry } from './run-mode-specs'
import type { SpecListEntry } from './run-mode-specs'

export const specsCommand = defineCommand({
  description: 'List all runnable spec for the selected Cypress instance.',
  params: [],
  handler: async (): Promise<SpecListEntry[]> => {
    return readRunModeSpecs().map(toSpecListEntry)
  },
})
