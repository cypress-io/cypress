import { nxs, NxsResult } from 'nexus-decorators'
import { Bundler, FrontendFramework } from '../constants'

@nxs.objectType({
  description: 'Details about an NPM Package listed during the wizard install',
})
export class WizardNpmPackage {
  constructor (private pkg: NpmPackages) {}

  @nxs.field.nonNull.string({
    description: 'The package name that you would npm install',
  })
  name (): NxsResult<'WizardNpmPackage', 'name'> {
    return this.pkg
  }

  @nxs.field.nonNull.string()
  description (): NxsResult<'WizardNpmPackage', 'description'> {
    return PACKAGES_DESCRIPTIONS[this.pkg]
  }
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
  reactjs: '@cypress/react',
  nuxtjs: '@cypress/vue',
  vuecli: '@cypress/vue',
  vuejs: '@cypress/vue',
}

export const BundleMapping: Record<Bundler, NpmPackages> = {
  vite: '@cypress/vite-dev-server',
  webpack: '@cypress/webpack-dev-server',
}
