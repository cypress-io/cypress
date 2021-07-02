import { Bundler } from './bundler'
import { Framework } from './frameworks'

const packages: Record<string, { description: string }> = {
  '@cypress/vue': {
    description:
      'Allows Cypress to mount each Vue component using `cy.mount()`',
  },
  '@cypress/react': {
    description:
      'Allows Cypress to mount each React component using `cy.mount()`',
  },
  '@cypress/webpack-dev-server': {
    description:
      'Allows Cypress to use your existing build configuration in order to bundle and run your tests',
  },
  '@cypress/vite-dev-server': {
    description:
      'Allows Cypress to use your existing build configuration in order to bundle and run your tests',
  },
  '@cypress/storybook': {
    description:
      'Allows Cypress to automatically read and test each of your stories',
  },
}

export function getPackages (framework: Framework, bundler: Bundler) {
  const libraryPackage = `@cypress/${framework.library}`
  const bundlerPackage = `@cypress/${bundler.id}-dev-server`

  return [
    {
      name: libraryPackage,
      description: packages[libraryPackage].description,
    },
    {
      name: bundlerPackage,
      description: packages[bundlerPackage].description,
    },
  ]
}
