import type { Wizard, WizardBundler } from '../generated/test-graphql-types.gen'
import * as wizardDeps from '@packages/scaffold-config/src/dependencies'
import type { MaybeResolver } from './clientTestUtils'
import { testNodeId } from './clientTestUtils'

const testBundlerVite = {
  type: 'vite',
  name: 'Vite',
} as const

const testBundlerWebpack = {
  type: 'webpack',
  name: 'Webpack',
} as const

const testBundlers = [
  testBundlerWebpack,
  testBundlerVite,
] as const

export const allBundlers = testBundlers.map((bundler, idx) => {
  return {
    ...testNodeId('WizardBundler'),
    isSelected: idx === 0,
    isDetected: false,
    ...bundler,
  }
})

const testFrameworks = [
  { name: 'Create React App (v5)', type: 'reactscripts', supportedBundlers: [testBundlerWebpack], category: 'framework', supportStatus: 'alpha' },
  { name: 'Vue.js (v3)', type: 'vue3', supportedBundlers: [testBundlerVite, testBundlerWebpack], category: 'library', supportStatus: 'full' },
] as const

export const stubWizard: MaybeResolver<Wizard> = {
  __typename: 'Wizard',
  installDependenciesCommand: `npm install -D ${wizardDeps.WIZARD_DEPENDENCY_REACT_SCRIPTS.package} ${wizardDeps.WIZARD_DEPENDENCY_TYPESCRIPT.package}`,
  packagesToInstall: [
    {
      __typename: 'WizardNpmPackage',
      id: 'cra',
      satisfied: true,
      ...wizardDeps.WIZARD_DEPENDENCY_REACT_SCRIPTS,
    },
    {
      __typename: 'WizardNpmPackage',
      id: 'typescript',
      satisfied: false,
      detectedVersion: '2.0.1',
      ...wizardDeps.WIZARD_DEPENDENCY_TYPESCRIPT,
    },
  ],
  allBundlers,
  frameworks: testFrameworks.map(({ name, type, supportedBundlers, category, supportStatus }, idx) => {
    return {
      ...testNodeId('WizardFrontendFramework'),
      supportStatus,
      name,
      category,
      type,
      supportedBundlers: supportedBundlers as unknown as WizardBundler[],
      isSelected: idx === 0,
      isDetected: false,
    }
  }),
  erroredFrameworks: [],
}
