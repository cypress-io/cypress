/**
 * This file is intended to test the new normalized signature
 * of devServers. To make the test shorter we only test
 * the smkoke test here
 */

const path = require('path')
const { devServer } = require('../../dist')

module.exports = (on, config) => {
  on('dev-server:start', async (options) => {
    return devServer(
      options,
      {
        configFile: path.resolve(__dirname, '..', '..', 'vite.config.ts'),
      },
    )
  })

  config.testFiles = '**/smoke.spec.ts'

  return config
}
