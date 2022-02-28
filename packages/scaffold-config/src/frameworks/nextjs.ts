import { BUNDLER_WEBPACK_4, CODE_GEN_FRAMEWORKS, CYPRESS_REACT_LATEST, FRONTEND_FRAMEWORK_CATEGORIES, STORYBOOK_REACT } from '../constants'

export const nextjs = {
  type: 'nextjs',
  name: 'Next.js',
  family: 'template',
  supportedBundlers: [BUNDLER_WEBPACK_4],
  packages: [
    CYPRESS_REACT_LATEST,
    BUNDLER_WEBPACK_4,
  ],
  defaultPackagePath: '@cypress/react/plugins/next',
  glob: '*.{js,jsx,tsx}',
  category: FRONTEND_FRAMEWORK_CATEGORIES[0],
  detectors: [
    {
      dependency: 'next',
      version: '>=10.0.0',
    },
  ],
  codeGenFramework: CODE_GEN_FRAMEWORKS[0],
  storybookDep: STORYBOOK_REACT,
  config: {
    js: () => ``,
    ts: () => ``,
  },
} as const
