import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand } from './definition'
import { toSpecListEntry } from './specs-list'
import type { SpecListEntry } from '../types'

export const specsCommand = defineCommand({
  description: 'List all runnable specs for the selected Cypress instance.',
  params: [],
  handler: async (_params, _options, runtime): Promise<SpecListEntry[]> => {
    return (await tapManagerDataSource.getRunnableSpecs(runtime.gqlClient)).map(toSpecListEntry)
  },
})
