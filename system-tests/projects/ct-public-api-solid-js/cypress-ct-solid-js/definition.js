'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const cypress_1 = require('cypress')
const dep = {
  // Unique, semantic identifier.
  type: 'cypress-ct-solid-js',
  // Human readable name.
  name: 'Solid.js',
  // Package name install from `npm`.
  package: 'solid-js',
  /**
     * Similar to package, but can include a version or tag.
     * Used during setup to generate an install command for users.
     * Eg: `solid-js@next`
     */
  installer: 'solid-js',
  // Human readable description.
  description: 'A required dependency for this project',
  // Minimum supported version.
  minVersion: '1.9.3',
}

/**
 * The definition.
 */
exports.default = (0, cypress_1.defineComponentFramework)({
  /**
     * This should match the `npm` package name.
     * The convention required to ensure your Definition is processed
     * by Cypress is `cypress-ct-*` for global packages, or
     * `@org/cypress-ct-*` for organization level packages.
     */
  type: 'cypress-ct-template',
  /**
     * The label that shows up when configuring Component Testing
     * for the first time.
     */
  name: 'Solid.js',
  /**
     * Supported bundlers. Can be "webpack" and/or "vite".
     * In this example, I'm only adding support for Solid.js with Vite.
     */
  supportedBundlers: ['vite', 'webpack'],
  /**
     * Used by Cypress to automatically detect the correct Framework Definition
     * based on the user's project.
     * In this example, if a module matching `solidDep`
     * is found in the user's project,
     * Solid.js will automatically be selected when configuring Component Testing.
     */
  detectors: [dep],
  /**
     * Optionally, some conditional logic, based on whether
     * the user selected Vite or webpack.
     */
  dependencies: (bundler) => {
    return [dep]
  },
})
