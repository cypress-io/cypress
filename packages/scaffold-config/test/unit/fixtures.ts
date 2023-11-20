import { defineComponentFramework } from 'cypress'

export const solidDep: Cypress.CypressComponentDependency = {
  type: 'solid-js',
  name: 'Solid.js',
  package: 'solid-js',
  installer: 'solid-js',
  description: 'Solid is a declarative JavaScript library for creating user interfaces',
  minVersion: '^1.0.0',
}

// must be default export
export default defineComponentFramework({
  type: 'cypress-ct-solid-js',

  category: 'library',

  name: 'Solid.js',

  supportedBundlers: ['webpack', 'vite'],

  detectors: [solidDep],

  // Cypress will include the bundler dependency here, if they selected one.
  dependencies: () => {
    return [solidDep]
  },
})
