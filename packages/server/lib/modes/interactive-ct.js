const chalk = require('chalk')
const human = require('human-interval')
const _ = require('lodash')
const Debug = require('debug')

const { getBrowsers } = require('../browsers/utils')
const errors = require('../errors')
const browsers = require('../browsers')
const { openProject } = require('../open_project')
const Updater = require('../updater')

const debug = Debug('cypress:server:interactive-ct')

const registerCheckForUpdates = () => {
  const checkForUpdates = (initialLaunch) => {
    Updater.check({
      initialLaunch,
      testingType: 'component',
      onNewVersion: _.noop,
      onNoNewVersion: _.noop,
    })
  }

  setInterval(() => checkForUpdates(false), human('60 minutes'))
  checkForUpdates(true)
}

// Partial because there are probably other options that are not included in this type.
// projectRoot: string
// args: LaunchArgs
const start = async (projectRoot, args) => {
  if (process.env['CYPRESS_INTERNAL_ENV'] === 'production') {
    registerCheckForUpdates()
  }

  debug('start server-ct on ', projectRoot)

  // add chrome as a default browser if none has been specified
  return browsers.ensureAndGetByNameOrPath(args.browser)
  .then((browser) => {
    const spec = {
      name: 'All Specs',
      absolute: '__all',
      relative: '__all',
      specType: 'component',
    }

    const options = {
      browsers: [browser],
    }

    debug('create project')

    return openProject.create(projectRoot, args, options)
    .then((project) => {
      debug('launch project')

      return openProject.launch(browser, spec, {
        onBrowserClose: () => {
          /* eslint-disable no-console */
          console.log(chalk.blue('BROWSER EXITED SAFELY'))
          console.log(chalk.blue('COMPONENT TESTING STOPPED'))
          process.exit()
        },
      })
    })
  })
}

const browsersForCtInteractive = ['chrome', 'chromium', 'edge', 'electron', 'firefox']

const returnDefaultBrowser = (browsersByPriority, installedBrowsers) => {
  const browserMap = installedBrowsers.reduce((acc, curr) => {
    acc[curr.name] = true

    return acc
  }, {})

  for (const browser of browsersByPriority) {
    if (browserMap[browser]) {
      return browser
    }
  }
}

const run = async (options) => {
  const installedBrowsers = await getBrowsers()

  options.browser = options.browser || returnDefaultBrowser(browsersForCtInteractive, installedBrowsers)

  return start(options.projectRoot, options).catch((e) => {
    // Usually this kind of error management is doen inside cypress.js start
    // But here we bypassed this since we don't use the window of the gui
    // Handle errors here to avoid multiple errors appearing.
    return errors.logException(e).then(() => {
      process.exit(1)
    })
  })
}

module.exports = {
  run,
  returnDefaultBrowser,
  browsersForCtInteractive,
}
