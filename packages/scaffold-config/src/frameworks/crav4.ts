import dedent from 'dedent'
import { BUNDLER_WEBPACK_4, CODE_GEN_FRAMEWORKS, CYPRESS_REACT_LATEST, FRONTEND_FRAMEWORK_CATEGORIES, STORYBOOK_REACT } from '../constants'

export const crav4 = {
  type: 'crav4',
  family: 'template',
  name: 'Create React App (v4)',
  supportedBundlers: [BUNDLER_WEBPACK_4],
  packages: [
    CYPRESS_REACT_LATEST,
    BUNDLER_WEBPACK_4,
  ],
  defaultPackagePath: '@cypress/react/plugins/react-scripts',
  glob: '*.{js,jsx,tsx}',
  category: FRONTEND_FRAMEWORK_CATEGORIES[0],
  codeGenFramework: CODE_GEN_FRAMEWORKS[0],
  storybookDep: STORYBOOK_REACT,
  detectors: [
    {
      dependency: 'react-scripts',
      version: '^4.0.0',
    },
  ],
  config: {
    js: () => {
      return dedent`
    const { devServer } = require('@cypress/react/plugins/react-scripts')

    module.exports = {
      component: {
        devServer,
      }
    }`
    },
    ts: () => {
      return dedent`
    import { defineConfig } from 'cypress'
    import { devServer } from '@cypress/react/plugins/react-scripts'

    export default defineConfig({
      component: {
        devServer,
      }
    })`
    },
  },
} as const
