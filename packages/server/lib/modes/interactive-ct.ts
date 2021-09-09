import chalk from 'chalk'
import human from 'human-interval'
import _ from 'lodash'
import Debug from 'debug'

import browserUtils from '../browsers/utils'
import browsers from '../browsers'
import { LaunchArgs, openProject } from '../open_project'
import * as Updater from '../updater'
import * as errors from '../errors'

const debug = Debug('cypress:server:interactive-ct')

const registerCheckForUpdates = () => {
  const checkForUpdates = (initialLaunch: boolean) => {
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

const start = async (projectRoot: string, args: LaunchArgs) => {
  if (process.env['CYPRESS_INTERNAL_ENV'] === 'production') {
    registerCheckForUpdates()
  }

  debug('start server-ct on ', projectRoot)

  // add chrome as a default browser if none has been specified
  return browsers.ensureAndGetByNameOrPath(args.browser)
  .then((browser: Cypress.Browser) => {
    const spec = {
      name: 'All Specs',
      absolute: '__all',
      relative: '__all',
      specType: 'component',
    } as const

    const options = {
      browsers: [browser],
    }

    debug('create project')

    return openProject.create(projectRoot, args, options)
    .then(() => {
      debug('launch project')

      return openProject.launch(browser, spec, {
        onBrowserClose: () => {
          // eslint-disable-next-line no-console
          console.log(chalk.blue('BROWSER EXITED SAFELY'))
          // eslint-disable-next-line no-console
          console.log(chalk.blue('COMPONENT TESTING STOPPED'))
          process.exit()
        },
      })
    })
  })
}

const browsersForCtInteractive = ['chrome', 'chromium', 'edge', 'electron', 'firefox'] as const

const returnDefaultBrowser = (
  browsersByPriority: typeof browsersForCtInteractive,
  installedBrowsers: any[],
) => {
  const browserMap = installedBrowsers.reduce((acc, curr) => {
    acc[curr.name] = true

    return acc
  }, {})

  for (const browser of browsersByPriority) {
    if (browserMap[browser]) {
      return browser
    }
  }

  return undefined
}

export const run = async (options: LaunchArgs) => {
  const installedBrowsers = await browserUtils.getBrowsers()

  options.browser = options.browser || returnDefaultBrowser(browsersForCtInteractive, installedBrowsers)

  return start(options.projectRoot, options).catch((e: Error) => {
    // Usually this kind of error management is doen inside cypress.js start
    // But here we bypassed this since we don't use the window of the gui
    // Handle errors here to avoid multiple errors appearing.
    return errors.logException(e).then(() => {
      process.exit(1)
    })
  })
}
