import type { Linter } from 'eslint'
import compat from 'eslint-plugin-compat'
import path from 'path'

const browserslistConfig = path.resolve(__dirname, '../../../browser-bundles.browserslistrc')

/**
 * Opt-in browser-API compatibility checks (eslint-plugin-compat) for code that
 * ships to the browser. Spread it after `baseConfig` in a browser bundle's
 * `eslint.config.ts`.
 *
 * Targets come from `browser-bundles.browserslistrc` at the repo root, read by
 * path for the reason given in that file's header.
 */
export const compatConfig: Linter.Config[] = [
  {
    // Shipped source only: specs run in the browser Cypress launches for them,
    // not on the floor
    files: [
      'src/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts,vue}',
      'injection/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}',
    ],
    ignores: ['**/*.{cy,spec,test}.*', '**/*.d.{ts,mts,cts}'],
    plugins: {
      compat,
    },
    settings: {
      browserslistOpts: {
        config: browserslistConfig,
      },
      // The plugin assumes a babel config means ES built-ins are polyfilled, but
      // only app's plugin-legacy polyfills any, and only for its own targets
      lintAllEsApis: true,
    },
    rules: {
      'compat/compat': 'error',
    },
  },
]
