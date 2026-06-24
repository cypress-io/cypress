import { defineCommand } from './definition'
import { readRunModeSpecs, toSpecListEntry } from './run-mode-specs'
import type { SpecListEntry } from './run-mode-specs'

export const specsCommand = defineCommand({
  description: 'list the specs the running Cypress instance can run',
  params: [],
  handler: async (): Promise<SpecListEntry[]> => {
    return readRunModeSpecs().map(toSpecListEntry)
  },
})
