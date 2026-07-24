import { posixify } from '../paths'
import type { RunnableSpec, SpecListEntry } from './types'

// The tap contract speaks POSIX paths (the run command accepts them and echoes
// them back); relative is OS-native, so it is backslash-separated on Windows.
// Normalize it here so every consumer sees the same path shape.
export const toSpecListEntry = ({ relative, lastModified }: RunnableSpec): SpecListEntry => {
  return {
    relativePath: posixify(relative),
    ...(lastModified != null ? { lastModified } : {}),
  }
}
