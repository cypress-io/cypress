/// reference path='../../../../../../../../../cli/types/index.d.ts' />

const path = require('path')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on) => {
  on('before:browser:launch', (browser, options) => {
    const downloadDirectory = path.join(__dirname, '..', 'downloads')

    if (browser.family === 'chromium') {
      options.preferences.default['download'] = { default_directory: downloadDirectory }

      return options
    }

    if (browser.family === 'firefox') {
      options.preferences['browser.download.dir'] = downloadDirectory
      options.preferences['browser.download.folderList'] = 2

      // needed to stop download prompt for text/csv files.
      options.preferences['browser.helperApps.neverAsk.saveToDisk'] = 'text/csv'

      return options
    }
  })
}
