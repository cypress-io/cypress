import { enumType } from 'nexus'
import dedent from 'dedent'

import type { NexusGenEnums } from '../gen/nxs.gen'

export const BUNDLER = ['webpack', 'vite'] as const

export type Bundler = typeof BUNDLER[number]

export const BundlerEnum = enumType({
  name: 'SupportedBundlers',
  description: 'The bundlers that we can use with Cypress',
  members: BUNDLER,
})

export const BundlerDisplayNames: Record<NexusGenEnums['SupportedBundlers'], string> = {
  vite: 'Vite',
  webpack: 'Webpack',
}

export const BundlerPackageNames: Record<NexusGenEnums['SupportedBundlers'], string> = {
  vite: '@cypress/vite-dev-server',
  webpack: '@cypress/webpack-dev-server',
}

export const WIZARD_NAVIGATE_DIRECTION = ['forward', 'back'] as const

export type WizardNavigateDirection = typeof WIZARD_NAVIGATE_DIRECTION[number]

export const WizardNavigateDirectionEnum = enumType({
  name: 'WizardNavigateDirection',
  members: WIZARD_NAVIGATE_DIRECTION,
})

export const FRONTEND_FRAMEWORK = ['nuxtjs', 'nextjs', 'cra', 'vuecli', 'react', 'vue'] as const

export type FrontendFramework = typeof FRONTEND_FRAMEWORK[number]

export const FrontendFrameworkEnum = enumType({
  name: 'FrontendFramework',
  members: FRONTEND_FRAMEWORK,
})

export const FrameworkDisplayNames: Record<NexusGenEnums['FrontendFramework'], string> = {
  cra: 'Create React App',
  vuecli: 'Vue CLI',
  react: 'React.js',
  vue: 'Vue.js',
  nextjs: 'Next.js',
  nuxtjs: 'Nuxt.js',
}

export const TESTING_TYPES = ['component', 'e2e'] as const

export type TestingType = typeof TESTING_TYPES[number]

export const TestingTypeEnum = enumType({
  name: 'TestingTypeEnum',
  members: TESTING_TYPES,
})

export const TestingTypeNames: Record<TestingType, string> = {
  component: 'Component Testing',
  e2e: 'E2E Testing',
}

export const TestingTypeDescriptions: Record<TestingType, string> = {
  component: 'Click here to configure Component Testing with your choice of framework and dev server.',
  e2e: 'Click here to configure end-to-end testing with Cypress.',
}

export const NAV_ITEM = [
  'projectSetup',
  'runs',
  'learn',
  'settings',
] as const

export type NavItem = typeof NAV_ITEM[number]

export const NavItemEnum = enumType({
  name: 'NavItem',
  members: NAV_ITEM,
})

export const WIZARD_STEP = [
  'welcome',
  'initializePlugins',
  'selectFramework',
  'installDependencies',
  'createConfig',
  'setupComplete',
] as const

interface NavItemDetails {
  displayName: string
  iconPath: string
}

export const NAV_ITEM_INFO: Record<NavItem, NavItemDetails> = {
  projectSetup: {
    displayName: 'Project Setup',
    iconPath: 'clarity/dashboard-line',
  },
  runs: {
    displayName: 'Runs',
    iconPath: 'clarity/bullet-list-line',
  },
  learn: {
    displayName: 'Learn',
    iconPath: 'clarity/terminal-line',
  },
  settings: {
    displayName: 'Settings',
    iconPath: 'clarity/settings-line',
  },
} as const

export type WizardStep = typeof WIZARD_STEP[number]

export const WizardStepEnum = enumType({
  name: 'WizardStep',
  members: WIZARD_STEP,
})

export const WIZARD_TITLES: Record<WizardStep, string | null> = {
  welcome: 'Welcome to Cypress',
  selectFramework: 'Project Setup',
  initializePlugins: 'Initializing Config...',
  installDependencies: 'Install Dev Dependencies',
  createConfig: 'Cypress.config',
  setupComplete: 'Setup Finished',
}

export const WIZARD_DESCRIPTIONS: Record<WizardStep, string | null> = {
  welcome: 'Choose which method of testing you would like to set up first.',
  selectFramework: 'Confirm the front-end framework and bundler fused in your project.',
  installDependencies: 'We need to install the following packages in order for component testing to work.',
  createConfig: 'Cypress will now create the following config file in the local directory for this project.',
  initializePlugins: 'Please wait while we load your project and find browsers installed on your system.',
  setupComplete: 'Setup complete! Let’s open your browser and start writing some tests!',
}

export const WIZARD_ALT_DESCRIPTIONS = {

} as const

export const WIZARD_CODE_LANGUAGE = ['js', 'ts'] as const

export type WizardCodeLanguage = typeof WIZARD_CODE_LANGUAGE[number]

export const WizardCodeLanguageEnum = enumType({
  name: 'WizardCodeLanguage',
  members: WIZARD_CODE_LANGUAGE,
})

export const FRAMEWORK_CONFIG_FILE: Partial<Record<NexusGenEnums['FrontendFramework'], Record<NexusGenEnums['WizardCodeLanguage'], string> | null>> = {
  nextjs: {
    js: dedent`
      const injectNextDevServer = require('@cypress/react/plugins/next')

      module.exports = {
        component (on, config) {
          injectNextDevServer(on, config)
        },
      }
    `,
    ts: dedent`
      import { defineConfig } from 'cypress'
      import injectNextDevServer from '@cypress/react/plugins/next'

      export default defineConfig({
        component (on, config) {
          injectNextDevServer(on, config)
        },
      })
    `,
  },
  nuxtjs: {
    js: dedent`
      const { startDevServer } = require('@cypress/webpack-dev-server')
      const { getWebpackConfig } = require('nuxt')

      module.exports = {
        component (on, config) {
          on('dev-server:start', async (options) => {
            let webpackConfig = await getWebpackConfig('modern', 'dev')

            return startDevServer({
              options,
              webpackConfig,
            })
          })
        },
      }
    `,
    ts: dedent`
      import { defineConfig } from 'cypress'
      import { startDevServer } from '@cypress/webpack-dev-server'
      import { getWebpackConfig } from 'nuxt'

      export default defineConfig({
        component (on, config) {
          on('dev-server:start', async (options) => {
            let webpackConfig = await getWebpackConfig('modern', 'dev')

            return startDevServer({
              options,
              webpackConfig,
            })
          })
        },
      })
    `,
  },
}

export const PACKAGES_DESCRIPTIONS = {
  '@cypress/vue': 'Allows Cypress to mount each Vue component using <em>cy.mount()</em>',
  '@cypress/react': 'Allows Cypress to mount each React component using <em>cy.mount()</em>',
  '@cypress/webpack-dev-server': 'Allows Cypress to use your existing build configuration in order to bundle and run your tests',
  '@cypress/vite-dev-server': 'Allows Cypress to use your existing build configuration in order to bundle and run your tests',
  '@cypress/storybook': 'Allows Cypress to automatically read and test each of your stories',
} as const

export type NpmPackages = keyof typeof PACKAGES_DESCRIPTIONS

export const PackageMapping: Record<FrontendFramework, NpmPackages> = {
  nextjs: '@cypress/react',
  cra: '@cypress/react',
  react: '@cypress/react',
  nuxtjs: '@cypress/vue',
  vuecli: '@cypress/vue',
  vue: '@cypress/vue',
}

export const BundleMapping: Record<Bundler, NpmPackages> = {
  vite: '@cypress/vite-dev-server',
  webpack: '@cypress/webpack-dev-server',
}
