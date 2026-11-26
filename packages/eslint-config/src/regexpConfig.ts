import type { Linter } from 'eslint'
import regexp from 'eslint-plugin-regexp'

/**
 * Opt-in regular expression checks (eslint-plugin-regexp's `recommended`
 * rules) for a workspace's JavaScript and TypeScript, `.vue` scripts
 * included. Spread it after `baseConfig`:
 * `export default [...baseConfig, ...regexpConfig]`.
 */
export const regexpConfig: Linter.Config[] = [
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts,vue}'],
    plugins: {
      regexp,
    },
    rules: {
      ...regexp.configs.recommended.rules,
    },
  },
]
