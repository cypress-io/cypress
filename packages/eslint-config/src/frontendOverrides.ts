/* Rule overrides shared by the Vue frontend packages: app, launchpad and frontend-shared */
import type { InfiniteDepthConfigWithExtends } from 'typescript-eslint'

export const frontendOverrides = [
  {
    files: ['**/*.vue'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@packages/data-context/*'],
            allowTypeImports: true,
            message: 'data-context is server-side; a Vue component may only borrow its types.',
          },
        ],
      }],
    },
  },
] satisfies InfiniteDepthConfigWithExtends[]
