/* Rule overrides shared by the Vue frontend packages: app, launchpad and frontend-shared */
import type { InfiniteDepthConfigWithExtends } from 'typescript-eslint'

export const frontendOverrides = [
  {
    // Not `.ts`: modules like the urql client import browser-safe values from data-context
    files: ['**/*.vue'],
    rules: {
      // A later block that sets this rule replaces these options instead of
      // merging with them, so add new patterns here rather than in a consumer
      '@typescript-eslint/no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@packages/data-context', '@packages/data-context/*'],
            allowTypeImports: true,
            message: 'data-context is server-side; a Vue component may only borrow its types.',
          },
        ],
      }],
    },
  },
] satisfies InfiniteDepthConfigWithExtends[]
