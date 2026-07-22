import type { RunnableSpec, SpecListEntry } from '../types'

export const toSpecListEntry = ({ relative, specType, lastModified }: RunnableSpec): SpecListEntry => {
  return {
    relativePath: relative,
    specType,
    ...(lastModified != null ? { lastModified } : {}),
  }
}
