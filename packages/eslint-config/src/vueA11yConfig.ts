import type { Linter } from 'eslint'
import vueA11y from 'eslint-plugin-vuejs-accessibility'

/**
 * Opt-in accessibility linting for Vue templates, for app, launchpad and
 * frontend-shared. Spread it after `baseConfig`, which sets up the `.vue` parser.
 *
 * The plugin's own `flat/recommended` preset is not used, because it also
 * replaces the `.vue` parser and adds browser globals for every file.
 */
export const vueA11yConfig: Linter.Config[] = [
  {
    files: ['**/*.vue'],
    plugins: {
      'vuejs-accessibility': vueA11y,
    },
    rules: {
      ...vueA11y.configs.recommended.rules,
      // The default requires a label to both wrap its control and name it with
      // `for`; HTML associates the two with either one
      'vuejs-accessibility/label-has-for': ['error', {
        required: { some: ['nesting', 'id'] },
      }],
    },
  },
]
