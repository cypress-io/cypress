/// <reference types="cypress" />
const { monorepoPaths } = require('../../../../../scripts/gulp/monorepoPaths')
import { e2ePluginSetup } from '@packages/frontend-shared/cypress/e2e/e2ePluginSetup'

// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = async (on, config) => {
  return await e2ePluginSetup(monorepoPaths.pkgApp, on, config)
}
