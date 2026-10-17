/* Rule overrides for Vue packages that write components as JSX/TSX */
import type { InfiniteDepthConfigWithExtends } from 'typescript-eslint'
import react from 'eslint-plugin-react'

// Vue JSX is indistinguishable from React JSX by file extension, and React rules
// misread it (e.g. `class` flagged as an unknown property)
export const vueTsxOverrides = [
  {
    files: ['**/*.{jsx,tsx}'],
    rules: Object.fromEntries(Object.keys(react.rules).map((name) => [`react/${name}`, 'off'])),
  },
] satisfies InfiniteDepthConfigWithExtends[]
