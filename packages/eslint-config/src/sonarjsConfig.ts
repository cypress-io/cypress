import type { Linter } from 'eslint'
import sonarjs from 'eslint-plugin-sonarjs'

const isOff = (entry: Linter.RuleEntry | undefined) => {
  const severity = Array.isArray(entry) ? entry[0] : entry

  return severity === undefined || severity === 'off' || severity === 0
}

const asWarning = (entry: Linter.RuleEntry): Linter.RuleEntry => {
  return Array.isArray(entry) ? ['warn', ...entry.slice(1)] as Linter.RuleEntry : 'warn'
}

const isFlatConfig = (config: unknown): config is Linter.Config => {
  return typeof config === 'object' && config !== null && !Array.isArray(config) && 'plugins' in config
}

const recommendedConfig = sonarjs.configs?.recommended

if (!isFlatConfig(recommendedConfig)) {
  throw new Error('eslint-plugin-sonarjs no longer exposes `configs.recommended` as a flat config')
}

const recommended = recommendedConfig.rules ?? {}

/**
 * SonarJS rules (bug detection, cognitive complexity, duplication), included in
 * `baseConfig`.
 *
 * Findings are warnings so they never fail `yarn lint`. CI counts them through
 * `ratchetFormatter.cjs` and fails only when a pull request adds more than
 * `develop` has.
 */
export const sonarjsConfig: Linter.Config[] = [
  {
    files: ['**/*.{js,jsx,ts,tsx,vue}'],
    plugins: recommendedConfig.plugins,
    rules: Object.fromEntries(
      Object.entries(recommended).map(([rule, entry]) => [rule, entry === undefined || isOff(entry) ? 'off' : asWarning(entry)]),
    ),
  },
  {
    files: ['**/*.{js,jsx,ts,tsx,vue}'],
    rules: {
      // Crashes on spec files (`Cannot read properties of undefined (reading
      // 'declarations')`), and a Cypress test asserts through `cy` commands the
      // rule does not recognise
      'sonarjs/assertions-in-tests': 'off',
    },
  },
]
