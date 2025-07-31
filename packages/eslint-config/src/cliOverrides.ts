/* Rule overrides specifically for CLI packages */
import type { InfiniteDepthConfigWithExtends } from 'typescript-eslint'

export const cliOverrides = [
  {
    rules: {
      'no-console': 'off',
    },
  },
] satisfies InfiniteDepthConfigWithExtends[]
