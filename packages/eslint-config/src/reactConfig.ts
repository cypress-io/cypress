import eslintReact from '@eslint-react/eslint-plugin'
import type { Linter } from 'eslint'

const recommended = eslintReact.configs['recommended-typescript']

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const recommendedReactSettings = recommended.settings?.['react-x']

/**
 * React rules, from `@eslint-react/eslint-plugin`'s `recommended-typescript`.
 * Add the block it returns after `baseConfig`, scoped to the workspace's React
 * files. Vue packages write components in Vue JSX, which React rules misread,
 * so the rules are opt-in rather than part of `baseConfig`.
 */
export const reactConfig = (files: string[]): Linter.Config => {
  return {
    ...recommended,
    files,
    settings: {
      ...recommended.settings,
      'react-x': {
        ...(isObject(recommendedReactSettings) ? recommendedReactSettings : {}),
        // @cypress/react supports React 18, so the rules that steer toward
        // React 19 APIs (`no-forward-ref`, `no-context-provider`,
        // `no-use-context`) must not flag code that has to run on 18
        version: '18',
      },
    },
    rules: {
      ...recommended.rules,
      '@eslint-react/dom-no-unknown-property': 'error',
      '@eslint-react/dom-no-unsafe-target-blank': 'error',
      // Index keys only break lists whose items move, and React files here
      // index lists that are static or only appended to
      '@eslint-react/no-array-index-key': 'off',
      // Performance advice: these flag a state update in an effect, such as a
      // mount flag, and an eager initial value passed to `useState`
      '@eslint-react/set-state-in-effect': 'off',
      '@eslint-react/use-state': 'off',
      // `Children.only` and `cloneElement` still work; these discourage the
      // APIs rather than a misuse of them
      '@eslint-react/no-children-only': 'off',
      '@eslint-react/no-clone-element': 'off',
    },
  }
}
