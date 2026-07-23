import type { FoundSpec } from '@packages/types'

import { posixify } from '../paths'
import type { SpecListEntry } from './types'

// The tap contract speaks POSIX paths (the run command accepts them and echoes
// them back); FoundSpec.relative is OS-native, so it is backslash-separated on
// Windows. Normalize it here so every consumer sees the same path shape.
export const toSpecListEntry = ({ relative }: FoundSpec): SpecListEntry => {
  return { relativePath: posixify(relative) }
}
