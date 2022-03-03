const path = require('path')
const { EventEmitter } = require('events')
const { startDevServer } = require('../')

const root = path.join(__dirname, '..')

const webpackConfig = {
  devServer: { static: { directory: root } },
}

const specs = [
  {
    name: `${root}/test/fixtures/foo.spec.js`,
    relative: `${root}/test/fixtures/foo.spec.js`,
    absolute: `${root}/test/fixtures/foo.spec.js`,
  },
]

const config = {
  projectRoot: root,
  supportFile: `${root}/test/fixtures/bar.spec.js`,
  isTextTerminal: true,
  devServerPublicPathRoute: root,
}

const run = async () => {
  const devServerEvents = new EventEmitter()
  const server = await startDevServer({
    webpackConfig,
    options: {
      config,
      specs,
      devServerEvents,
    },
  })

  return server
}

run().then((s) => {
  global.server = s
})
