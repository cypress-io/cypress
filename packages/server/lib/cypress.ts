/* eslint-disable
    no-console,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('./environment')

//# we are not requiring everything up front
//# to optimize how quickly electron boots while
//# in dev or linux production. the reasoning is
//# that we likely may need to spawn a new child process
//# and its a huge waste of time (about 1.5secs) of
//# synchronous requires the first go around just to
//# essentially do it all again when we boot the correct
//# mode.

import _ from 'lodash'
import Promise from 'bluebird'
import debugLib from 'debug'
import { OptionsMode, OptionsArgv } from './util/args'

const debug = debugLib('cypress:server:cypress')

const exit = function(code = 0) {
  //# TODO: we shouldn't have to do this
  //# but cannot figure out how null is
  //# being passed into exit
  debug('about to exit with code', code)

  return process.exit(code)
}

const exit0 = () => {
  return exit(0)
}

const exitErr = function(err: Error) {
  //# log errors to the console
  //# and potentially raygun
  //# and exit with 1
  debug('exiting with err', err)

  return require('./errors')
    .log(err)
    .then(() => {
      return exit(1)
    })
}

declare global {
  namespace NodeJS {
    interface ProcessVersions {
      electron?: string
    }
  }
}

function isCurrentlyRunningElectron() {
  return !!(process.versions && process.versions.electron)
}

function runElectron(mode: OptionsMode, options: OptionsArgv) {
  //# wrap all of this in a promise to force the
  //# promise interface - even if it doesn't matter
  //# in dev mode due to cp.spawn
  return Promise.try(() => {
    //# if we have the electron property on versions
    //# that means we're already running in electron
    //# like in production and we shouldn't spawn a new
    //# process
    if (isCurrentlyRunningElectron()) {
      //# just run the gui code directly here
      //# and pass our options directly to main
      if (mode === 'run') {
        const {
          modeDispatch,
        } = require('./modes/run') as typeof import('./modes/run')
        return modeDispatch(mode, options)
      }
      if (mode === 'interactive') {
        const interactiveDispatch = require('./modes/interactive.coffee') as typeof import('./modes/interactive.coffee').default
        return interactiveDispatch(mode, options)
      }
      throw new Error(`Mode not supported: ${mode}`)
    }

    return new Promise((resolve) => {
      const cypressElectron = require('@packages/electron')
      const fn = function(code: number) {
        //# juggle up the totalFailed since our outer
        //# promise is expecting this object structure
        debug('electron finished with', code)

        return resolve({ totalFailed: code })
      }

      return cypressElectron.open(
        '.',
        require('./util/args').toArray(options),
        fn
      )
    })
  })
}

function openProject(options: OptionsArgv) {
  //# this code actually starts a project
  //# and is spawned from nodemon
  return require('./open_project').open(options.project, options)
}

export function start(argv: string[] = []) {
  debug('starting cypress with argv %o', argv)

  const argsUtil = require('./util/args') as typeof import('./util/args')

  const options = argsUtil.toObject(argv)

  if (options.runProject && !options.headed) {
    // scale the electron browser window
    // to force retina screens to not
    // upsample their images when offscreen
    // rendering
    const electronAppUtil = require('./util/electron_app') as typeof import('./util/electron_app')
    electronAppUtil.scale()
  }

  const appDataUtil = require('./util/app_data') as typeof import('./util/app_data')

  //# make sure we have the appData folder
  return appDataUtil.ensure().then(() => {
    //# else determine the mode by
    //# the passed in arguments / options
    //# and normalize this mode
    const mode = (() => {
      switch (false) {
        case !options.version:
          return 'version'

        case !options.smokeTest:
          return 'smokeTest'

        case !options.returnPkg:
          return 'returnPkg'

        // case !options.logs:
        //   return "logs"

        case !options.clearLogs:
          return 'clearLogs'

        case !options.getKey:
          return 'getKey'

        case !options.generateKey:
          return 'generateKey'

        case options.exitWithCode == null:
          return 'exitWithCode'

        case !options.runProject:
          //# go into headless mode when running
          //# until completion + exit
          return 'run'

        default:
          //# set the default mode as interactive
          return options.mode || 'interactive'
      }
    })()

    return startInMode(mode, options)
  })
}

function startInMode(mode: OptionsMode, options: OptionsArgv) {
  debug('starting in mode %s', mode)

  switch (mode) {
    case 'version':
      return require('./modes/pkg')(options)
        .get('version')
        .then((version: string) => {
          return console.log(version)
        })
        .then(exit0)
        .catch(exitErr)

    case 'smokeTest':
      return require('./modes/smoke_test')(options)
        .then((pong: string) => {
          return console.log(pong)
        })
        .then(exit0)
        .catch(exitErr)

    case 'returnPkg':
      return require('./modes/pkg')(options)
        .then((pkg: object) => {
          return console.log(JSON.stringify(pkg))
        })
        .then(exit0)
        .catch(exitErr)

    case 'logs':
      //# print the logs + exit
      return require('./gui/logs')
        .print()
        .then(exit0)
        .catch(exitErr)

    case 'clearLogs':
      //# clear the logs + exit
      return require('./gui/logs')
        .clear()
        .then(exit0)
        .catch(exitErr)

    case 'getKey':
      //# print the key + exit
      return require('./project')
        .getSecretKeyByPath(options.projectRoot)
        .then((key: string) => {
          return console.log(key)
        })
        .then(exit0)
        .catch(exitErr)

    case 'generateKey':
      //# generate + print the key + exit
      return require('./project')
        .generateSecretKeyByPath(options.projectRoot)
        .then((key: string) => {
          return console.log(key)
        })
        .then(exit0)
        .catch(exitErr)

    case 'exitWithCode':
      return require('./modes/exit')(options)
        .then(exit)
        .catch(exitErr)

    case 'run':
      //# run headlessly and exit
      //# with num of totalFailed
      return runElectron(mode, options)
        .get('totalFailed')
        .then(exit)
        .catch(exitErr)

    case 'interactive':
      return runElectron(mode, options)

    case 'openProject':
      //# open + start the project
      return openProject(options)

    default:
      throw new Error(`Cannot start. Invalid mode: '${mode}'`)
  }
}
