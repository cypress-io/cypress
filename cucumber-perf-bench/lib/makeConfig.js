'use strict'

const path = require('node:path')

// Builds a minimal object shaped like Cypress.PluginConfigOptions, sufficient
// for the preprocessor's compile()/resolve()/getSpecs() path. `tracking`
// toggles report generation (isTrackingState) via the rc-less env overrides.
function makeConfig (projectRoot, { tracking = false } = {}) {
  // The preprocessor reads report toggles from flat env overrides. Forcing
  // them on/off exercises the isTrackingState branch without regenerating.
  const env = {
    messagesEnabled: tracking,
    jsonEnabled: tracking,
    htmlEnabled: tracking,
  }

  return {
    projectRoot,
    testingType: 'e2e',
    specPattern: 'cypress/e2e/**/*.feature',
    excludeSpecPattern: [],
    supportFile: false,
    reporter: 'spec',
    env,
    // a few fields various helpers read defensively
    configFile: path.join(projectRoot, 'cypress.config.js'),
    version: '13.0.0',
  }
}

module.exports = { makeConfig }
