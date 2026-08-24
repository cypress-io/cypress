/* Rule overrides specifically for the Vue frontend packages */
import type { InfiniteDepthConfigWithExtends } from 'typescript-eslint'

export const frontendOverrides = [
  {
    languageOptions: {
      globals: {
        // the bundler statically replaces `process.env.NODE_ENV` at build time
        process: 'readonly',
      },
    },
  },
  {
    // these are Vue JSX, where `class` and `for` are the correct attribute names
    files: ['**/*.{jsx,tsx}'],
    rules: {
      'react/no-unknown-property': ['warn', { ignore: ['class', 'for'] }],
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      // SFCs are `<script lang="ts">`, so tsc resolves ambient types (JSX, JQuery)
      // that no-undef cannot see. typescript-eslint drops the rule on .ts for the
      // same reason, but its config does not match .vue.
      'no-undef': 'off',
      'vue/no-v-html': 'off',
      '@stylistic/function-call-spacing': 'off',
      // data-context runs in Node, so only its types may cross into browser code
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@packages/data-context/*'],
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
] satisfies InfiniteDepthConfigWithExtends[]
