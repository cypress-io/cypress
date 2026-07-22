import type { RunnableSpec, SpecListEntry } from '../types'

export const toSpecListEntry = ({ relative, specType }: RunnableSpec): SpecListEntry => {
  return { relativePath: relative, specType }
}
