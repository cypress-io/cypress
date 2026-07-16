import { tapManagerDataSource } from '../TapManagerDataSource'
import { defineCommand } from './definition'
import { toSpecListEntry } from './specs-list'
import type { SpecListEntry } from './specs-list'

export const specsCommand = defineCommand({
  description: 'List all runnable specs for the selected Cypress instance.',
  params: [],
  handler: async (): Promise<SpecListEntry[]> => {
    return tapManagerDataSource.getRunnableSpecs().map(toSpecListEntry)
  },
})
