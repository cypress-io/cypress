import type { InfiniteDepthConfigWithExtends } from 'typescript-eslint'
import { reactRulesOff } from './reactRulesOff'

// Vue JSX is indistinguishable from React JSX by file extension, and React rules
// misread it (e.g. `class` flagged as an unknown property). Spread after
// `baseConfig` and after any `react/*` rule settings, or they switch back on.
export const vueTsxOverrides = [
  {
    files: ['**/*.{jsx,tsx}'],
    rules: reactRulesOff,
  },
] satisfies InfiniteDepthConfigWithExtends[]
