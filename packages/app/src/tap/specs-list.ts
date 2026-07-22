import type { FoundSpec } from '@packages/types'

import type { SpecListEntry } from './types'

export const toSpecListEntry = ({ relative }: FoundSpec): SpecListEntry => {
  return { relativePath: relative }
}
