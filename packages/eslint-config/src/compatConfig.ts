import type { Linter } from 'eslint'
import compat from 'eslint-plugin-compat'
import path from 'path'

const browserslistConfig = path.resolve(__dirname, '../../../browser-bundles.browserslistrc')

/**
 * Opt-in browser-API compatibility checks (eslint-plugin-compat) for code that
 * ships to the browser. Spread it after `baseConfig` in a browser bundle's
 * `eslint.config.ts`.
 *
 * Targets come from `browser-bundles.browserslistrc` at the repo root, the
 * browser floor from AGENTS.md "Runtime targets".
 */
export const compatConfig: Linter.Config[] = [
  {
    // Shipped source only: specs run in the browser Cypress launches for them,
    // not on the floor
    files: ['src/**/*.{js,jsx,ts,tsx,vue}', 'injection/**/*.{js,jsx,ts,tsx}'],
    ignores: ['**/*.{cy,spec,test}.{js,jsx,ts,tsx}', '**/*.d.ts'],
    plugins: {
      compat,
    },
    settings: {
      // Read by path because browserslist doesn't discover the file by name;
      // see the comment at the top of it
      browserslistOpts: {
        config: browserslistConfig,
      },
      // The bundlers transpile syntax, but only app's plugin-legacy polyfills
      // built-ins, and only for its own targets. So ES APIs such as
      // `Array.prototype.toSorted` are checked too. Without this the plugin
      // skips them whenever it finds a babel config near the file.
      lintAllEsApis: true,
    },
    rules: {
      'compat/compat': 'error',
    },
  },
]
