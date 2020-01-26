require('./environment')

// we are not requiring everything up front
// to optimize how quickly electron boots while
// in dev or linux production. the reasoning is
// that we likely may need to spawn a new child process
// and its a huge waste of time (about 1.5secs) of
// synchronous requires the first go around just to
// essentially do it all again when we boot the correct
// mode.

const R = require('ramda')
const Promise = require('bluebird')
const debug = require('debug')('cypress:server:cypress')
const argsUtils = require('./util/args')

const warning = (code) => {
  return require('./errors').warning(code)
}

const exit = (code = 0) => {
  // TODO: we shouldn't have to do this
  // but cannot figure out how null is
  // being passed into exit
  debug('about to exit with code', code)

  return process.exit(code)
}

const exit0 = () => {
  return exit(0)
}

const exitErr = (err) => {
  // log errors to the console
  // and potentially raygun
  // and exit with 1
  debug('exiting with err', err)

  return require('./errors').logException(err)
  .then(() => {
    return exit(1)
  })
}

module.exports = {
  isCurrentlyRunningElectron () {
    return !!(process.versions && process.versions.electron)
  },

  runElectron (mode, options) {
    // wrap all of this in a promise to force the
    // promise interface - even if it doesn't matter
    // in dev mode due to cp.spawn
    return Promise.try(() => {
      // if we have the electron property on versions
      // that means we're already running in electron
      // like in production and we shouldn't spawn a new
      // process
      if (this.isCurrentlyRunningElectron()) {
        // if we weren't invoked from the CLI
        // then display a warning to the user
        if (!options.invokedFromCli) {
          warning('INVOKED_BINARY_OUTSIDE_NPM_MODULE')
        }

        // just run the gui code directly here
        // and pass our options directly to main
        debug('running Electron currently')

        return require('./modes')(mode, options)
      }

      return new Promise((resolve) => {
        debug('starting Electron')
        const cypressElectron = require('@packages/electron')

        const fn = (code) => {
          // juggle up the totalFailed since our outer
          // promise is expecting this object structure
          debug('electron finished with', code)

          if (mode === 'smokeTest') {
            return resolve(code)
          }

          return resolve({ totalFailed: code })
        }

        const args = require('./util/args').toArray(options)

        debug('electron open arguments %o', args)

        return cypressElectron.open('.', args, fn)
      })
    })
  },

  openProject (options) {
    // this code actually starts a project
    // and is spawned from nodemon
    return require('./open_project').open(options.project, options)
  },

  runServer (options) {
    // args = {}
    //
    // _.defaults options, { autoOpen: true }
    //
    // if not options.project
    //   throw new Error("Missing path to project:\n\nPlease pass 'npm run server -- --project /path/to/project'\n\n")
    //
    // if options.debug
    //   args.debug = "--debug"
    //
    // ## just spawn our own index.js file again
    // ## but put ourselves in project mode so
    // ## we actually boot a project!
    // _.extend(args, {
    //   script:  "index.js"
    //   watch:  ["--watch", "lib"]
    //   ignore: ["--ignore", "lib/public"]
    //   verbose: "--verbose"
    //   exts:   ["-e", "coffee,js"]
    //   args:   ["--", "--config", "port=2020", "--mode", "openProject", "--project", options.project]
    // })
    //
    // args = _.chain(args).values().flatten().value()
    //
    // cp.spawn("nodemon", args, {stdio: "inherit"})
    //
    // ## auto open in dev mode directly to our
    // ## default cypress web app client
    // if options.autoOpen
    //   _.delay ->
    //     require("./browsers").launch("chrome", "http://localhost:2020/__", {
    //       proxyServer: "http://localhost:2020"
    //     })
    //   , 2000
    //
    // if options.debug
    //   cp.spawn("node-inspector", [], {stdio: "inherit"})
    //
    //   require("opn")("http://127.0.0.1:8080/debug?ws=127.0.0.1:8080&port=5858")
  },

  start (argv = []) {
    debug('starting cypress with argv %o', argv)

    // if the CLI passed "--" somewhere, we need to remove it
    // for https://github.com/cypress-io/cypress/issues/5466
    argv = R.without('--', argv)

    const options = argsUtils.toObject(argv)

    debug('from argv %o got options %o', argv, options)

    if (options.headless) {
      // --headless is same as --headed false
      if (options.headed) {
        throw new Error('Impossible options: both headless and headed are true')
      }

      options.headed = false
    }

    if (options.runProject && !options.headed) {
      debug('scaling electron app in headless mode')
      // scale the electron browser window
      // to force retina screens to not
      // upsample their images when offscreen
      // rendering
      require('./util/electron_app').scale()
    }

    // make sure we have the appData folder
    return require('./util/app_data').ensure()
    .then(() => {
      // else determine the mode by
      // the passed in arguments / options
      // and normalize this mode
      let mode = options.mode || 'interactive'

      if (options.version) {
        mode = 'version'
      } else if (options.smokeTest) {
        mode = 'smokeTest'
      } else if (options.returnPkg) {
        mode = 'returnPkg'
      } else if (options.logs) {
        mode = 'logs'
      } else if (options.clearLogs) {
        mode = 'clearLogs'
      } else if (options.getKey) {
        mode = 'getKey'
      } else if (options.generateKey) {
        mode = 'generateKey'
      } else if (!(options.exitWithCode == null)) {
        mode = 'exitWithCode'
      } else if (options.runProject) {
        // go into headless mode when running
        // until completion + exit
        mode = 'run'
      }

      return this.startInMode(mode, options)
    })
  },

  startInMode (mode, options) {
    debug('starting in mode %s with options %o', mode, options)

    switch (mode) {
      case 'version':
        return require('./modes/pkg')(options)
        .get('version')
        .then((version) => {
          return console.log(version) // eslint-disable-line no-console
        }).then(exit0)
        .catch(exitErr)

      case 'smokeTest':
        return this.runElectron(mode, options)
        .then((pong) => {
          if (!this.isCurrentlyRunningElectron()) {
            return pong
          }

          if (pong === options.ping) {
            return 0
          }

          return 1
        }).then(exit)
        .catch(exitErr)

      case 'returnPkg':
        return require('./modes/pkg')(options)
        .then((pkg) => {
          return console.log(JSON.stringify(pkg)) // eslint-disable-line no-console
        }).then(exit0)
        .catch(exitErr)

      case 'logs':
        // print the logs + exit
        return require('./gui/logs').print()
        .then(exit0)
        .catch(exitErr)

      case 'clearLogs':
        // clear the logs + exit
        return require('./gui/logs').clear()
        .then(exit0)
        .catch(exitErr)

      case 'getKey':
        // print the key + exit
        return require('./project').getSecretKeyByPath(options.projectRoot)
        .then((key) => {
          return console.log(key) // eslint-disable-line no-console
        }).then(exit0)
        .catch(exitErr)

      case 'generateKey':
        // generate + print the key + exit
        return require('./project').generateSecretKeyByPath(options.projectRoot)
        .then((key) => {
          return console.log(key) // eslint-disable-line no-console
        }).then(exit0)
        .catch(exitErr)

      case 'exitWithCode':
        return require('./modes/exit')(options)
        .then(exit)
        .catch(exitErr)

      case 'run':
        // run headlessly and exit
        // with num of totalFailed
        return this.runElectron(mode, options)
        .get('totalFailed')
        .then(exit)
        .catch(exitErr)

      case 'interactive':
        return this.runElectron(mode, options)

      case 'server':
        return this.runServer(options)

      case 'openProject':
        // open + start the project
        return this.openProject(options)

      default:
        throw new Error(`Cannot start. Invalid mode: '${mode}'`)
    }
  },
}
