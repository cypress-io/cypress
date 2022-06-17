/* eslint-disable no-restricted-syntax */
const fs = require('fs')
const { expect } = require('chai')

module.exports = {
  'retries': null,
  'e2e': {
    'supportFile': 'cypress/support.js',
    setupNodeEvents (on, config) {
      expect(process.geteuid()).to.not.eq(0)
      console.log('✅ not running as root')

      let err

      try {
        fs.accessSync(config.projectRoot, fs.constants.W_OK)
      } catch (e) {
        err = e
      }

      expect(err).to.include({ code: 'EACCES' })

      console.log(`✅ ${config.projectRoot} is not writable`)

      return config
    },

  },
}
