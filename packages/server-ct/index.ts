/* eslint-disable no-console */
import browsers from '@packages/server/lib/browsers'
import * as random from '@packages/server/lib/util/random'
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
    } as const

    /**
     * store warnings in this var
     * before the runner is connected
     */
    let warningStack: any[] = []
    let isRunnerConnected = false
    /**
     * as soon as the runner is connected,
     * this variable contains a socket to talk
     * to the runner-ct
     */
    let cySocket

    /**
     * Push project-wide warnings to the runner-ct
     * @param warning
     */
    const showWarning = (warning) => {
      const warnObj = { ...warning }

      warnObj.message = warning.message
      cySocket.toRunner('project:warning', warnObj)
    }

    const options = {
      browsers: [browser],
      onWarning (warning) {
        // when the runner is connected
        // we can show the warinng without loosing them
        if (isRunnerConnected) {
          showWarning(warning)
        } else {
          // until the runner is connected stack
        // the warnings
          warningStack.push(warning)
        }
      },
      onConnect (id, socket, _cySocket) {
        cySocket = _cySocket
        if (warningStack.length) {
          warningStack.forEach((warning) => {
            showWarning(warning)
          })

          warningStack = []
        }
      },
    }

    debug('create project')

    // runner-ct will need access to communications before
    // we run a spec. assigning a socketId before we create
    // when we open, the app already has a connection
    args.config.socketId = random.id()

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
