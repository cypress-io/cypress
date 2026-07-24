import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand } from './definition'
import { toSpecListEntry } from '../specs-list'
import type { SpecListEntry } from '../types'

export const specsCommand = defineCommand('specs', async (): Promise<SpecListEntry[]> => {
  return tapManagerDataSource.getRunnableSpecs().map(toSpecListEntry)
})
