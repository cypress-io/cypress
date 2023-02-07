import { ComponentFrameworkDefinition, CypressComponentDependency } from '../../src'
import * as dependencies from '../../src/dependencies'

export const solidDep: CypressComponentDependency = {
  type: 'solid-js',
  name: 'Solid.js',
  package: 'solid-js',
  installer: 'solid-js',
  description: 'Solid is a declarative JavaScript library for creating user interfaces',
  minVersion: '^1.0.0',
}

// must be default export
export const solidJs: ComponentFrameworkDefinition = {
  type: 'cypress-ct-solid-js',

  configFramework: 'cypress-ct-solid-js',

  category: 'library',

  name: 'Solid.js',

  supportedBundlers: [dependencies.WIZARD_DEPENDENCY_WEBPACK, dependencies.WIZARD_DEPENDENCY_VITE],

  getDevServerConfig: (projectRoot, bundler) => {
    // console.log('running getDevServerConfig', projectRoot)
    const c = require(require.resolve('webpack.config.js', { paths: [projectRoot] }))

    // console.log(c)
    return c
  },

  detectors: [solidDep],

  // Cypress will include the bundler dependency here, if they selected one.
  dependencies: () => {
    return [solidDep]
  },

  mountModule: (projectPath: string) => Promise.resolve('cypress-ct-solid-js'),
}
