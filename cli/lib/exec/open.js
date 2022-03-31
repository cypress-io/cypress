const debug = require('debug')('cypress:cli')
const os = require('os')
const util = require('../util')
const spawn = require('./spawn')
const verify = require('../tasks/verify')
const { processTestingType } = require('./shared')

const processOpenOptions = (options) => {
  if (!util.isInstalledGlobally() && !options.global && !options.project) {
    options.project = process.cwd()
  }

  const args = []

  if (options.config) {
    args.push('--config', options.config)
  }

  if (options.configFile !== undefined) {
    args.push('--config-file', options.configFile)
  }

  if (options.browser) {
    args.push('--browser', options.browser)
  }

  if (options.env) {
    args.push('--env', options.env)
  }

  if (options.port) {
    args.push('--port', options.port)
  }

  if (options.project) {
    args.push('--project', options.project)
  }

  args.push(...processTestingType(options.testingType))

  debug('opening from options %j', options)
  debug('command line arguments %j', args)

  return args
}

module.exports = {
  processOpenOptions,
  start (options = {}) {
    const args = processOpenOptions(options)

    function getOpenModeEnv () {
      if (os.platform() !== 'linux') return

      // on non-GTK desktop environments (KDE, XFCE, ...), native file pickers will not be used in Electron unless
      // we explicitly opt-in the the GTK portal functionality
      // @see https://tristan.partin.io/blog/2021/04/01/electron-linux-and-your-file-chooser/
      return { GTK_USE_PORTAL: '1' }
    }

    function open () {
      return spawn.start(args, {
        dev: options.dev,
        detached: Boolean(options.detached),
        stdio: 'inherit',
        env: getOpenModeEnv(),
      })
    }

    if (options.dev) {
      return open()
    }

    return verify.start()
    .then(open)
  },
}
