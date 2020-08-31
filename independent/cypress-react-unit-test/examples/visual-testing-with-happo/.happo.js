// https://docs.happo.io/docs/cypress
const { RemoteBrowserTarget } = require('happo.io')

// use the same resolution as cypress.json
const cypressConfig = require('./cypress.json')
const width = cypressConfig.viewportWidth || 1000
const height = cypressConfig.viewportHeight || 660
const viewport = `${width}x${height}`

module.exports = {
  apiKey: process.env.HAPPO_API_KEY,
  apiSecret: process.env.HAPPO_API_SECRET,
  targets: {
    chrome: new RemoteBrowserTarget('chrome', {
      viewport,
    }),
  },
}
