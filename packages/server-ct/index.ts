/* eslint-disable no-console */
import browsers from '@packages/server/lib/browsers'
import { LaunchArgs, openProject } from '@packages/server/lib/open_project'
import chalk from 'chalk'
import human from 'human-interval'
import _ from 'lodash'
import Debug from 'debug'

export * from './src/server-ct'

export * from './src/socket-ct'

const debug = Debug('cypress:server-ct:index')

const Updater = require('@packages/server/lib/updater')

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
export const start = async (projectRoot: string, args: LaunchArgs) => {
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
    }

    const options = {
      browsers: [browser],
    } as const

    debug('create project')

    return openProject.create(projectRoot, args, options)
    .then((project) => {
      debug('launch project')

      return openProject.launch(browser, spec, {
        onBrowserClose: () => {
          console.log(chalk.blue('BROWSER EXITED SAFELY'))
          console.log(chalk.blue('COMPONENT TESTING STOPPED'))
          process.exit()
        },
      })
    })
  })
}
