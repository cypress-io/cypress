const path = require('path')
const { startDevServer } = require('../dist')

module.exports = (on, config) => {
  on('dev-server:start', async (options) => {
    return startDevServer({
      options,
      viteConfig: {
        configFile: path.resolve(__dirname, '..', 'vite.config.ts'),
      },
    })
  })

  return config
}
