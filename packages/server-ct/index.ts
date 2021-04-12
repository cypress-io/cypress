/* eslint-disable no-console */
import browsers from '@packages/server/lib/browsers'
import openProject from '@packages/server/lib/open_project'
import chalk from 'chalk'
import human from 'human-interval'
import _ from 'lodash'

export * from './src/project-ct'

export * from './src/server-ct'

export * from './src/socket-ct'

export * from './src/specs-store'

const Updater = require('@packages/server/lib/updater')

const registerCheckForUpdates = () => {
  const checkForUpdates = (initialLaunch) => {
    Updater.check({
      initialLaunch,
      testingType: 'ct',
      onNewVersion: _.noop,
      onNoNewVersion: _.noop,
    })
  }

  setInterval(() => checkForUpdates(false), human('60 minutes'))
  checkForUpdates(true)
}

// Partial because there are probably other options that are not included in this type.
export const start = async (projectRoot: string, args: Record<string, any>) => {
  if (process.env['CYPRESS_INTERNAL_ENV'] === 'production') {
    registerCheckForUpdates()
  }

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
    }

    return openProject.create(projectRoot, args, options)
    .then((project) => {
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
