// @ts-nocheck

import Bluebird from 'bluebird'
import check from 'check-more-types'
import Debug from 'debug'
import EE from 'events'
import la from 'lazy-ass'
import _ from 'lodash'
import path from 'path'
import R from 'ramda'
import commitInfo from '@cypress/commit-info'
import { RunnablesStore } from '@packages/reporter'
import { ServerCt } from '@packages/server-ct'
import api from './api'
import { Automation } from './automation'
import cache from './cache'
import config from './config'
import cwd from './cwd'
import errors from './errors'
import logger from './logger'
import Reporter from './reporter'
import savedState from './saved_state'
import scaffold from './scaffold'
import { ServerE2E } from './server-e2e'
import user from './user'
import { ensureProp } from './util/class-helpers'
import { escapeFilenameInUrl } from './util/escape_filename'
import { fs } from './util/fs'
import keys from './util/keys'
import settings from './util/settings'
import specsUtil from './util/specs'
import Watchers from './watchers'

interface CloseOptions {
  onClose: () => any
}

interface OpenOptions {
  onOpen: (cfg: any) => Bluebird<any>
  onAfterOpen: (cfg: any) => Bluebird<any>
}

// type ProjectOptions = Record<string, any>

export type Cfg = Record<string, any>

const localCwd = cwd()
const multipleForwardSlashesRe = /[^:\/\/](\/{2,})/g

const debug = Debug('cypress:server:project')
const debugScaffold = Debug('cypress:server:scaffold')

export class ProjectBase<TServer extends ServerE2E | ServerCt> extends EE {
  protected projectRoot: string
  protected watchers: Watchers
  protected options?: Record<string, any>
  protected spec: Cypress.Cypress['spec'] | null
  protected _cfg?: Cfg
  protected _server?: TServer
  protected _automation?: Automation
  private _recordTests = null

  public browser: any

  constructor (projectRoot: string) {
    super()

    if (!projectRoot) {
      throw new Error('Instantiating lib/project requires a projectRoot!')
    }

    if (!check.unemptyString(projectRoot)) {
      throw new Error(`Expected project root path, not ${projectRoot}`)
    }

    this.projectRoot = path.resolve(projectRoot)
    this.watchers = new Watchers()
    this.spec = null
    this.browser = null

    debug('Project created %o', {
      projectType: this.projectType,
      projectRoot: this.projectRoot,
    })
  }

  protected ensureProp = ensureProp

  get projectType () {
    if (this.constructor === ProjectBase) {
      return 'base'
    }

    throw new Error('Project#projectType must be defined')
  }

  setOnTestsReceived (fn) {
    this._recordTests = fn
  }

  get server () {
    return this.ensureProp(this._server, 'open')
  }

  get automation () {
    return this.ensureProp(this._automation, 'open')
  }

  get cfg () {
    return this.ensureProp(this._cfg, 'open')
  }

  open (options = {}, callbacks: OpenOptions) {
    debug('opening project instance %s', this.projectRoot)
    debug('project open options %o', options)

    _.defaults(options, {
      report: false,
      onFocusTests () {},
      onError () {},
      onWarning () {},
      onSettingsChanged: false,
    })

    debug('project options %o', options)
    this.options = options

    return this.getConfig(options)
    .tap((cfg) => {
      process.chdir(this.projectRoot)

      // attach warning message if user has "chromeWebSecurity: false" for unsupported browser
      if (cfg.chromeWebSecurity === false) {
        _.chain(cfg.browsers)
        .filter((browser) => browser.family !== 'chromium')
        .each((browser) => browser.warning = errors.getMsgByType('CHROME_WEB_SECURITY_NOT_SUPPORTED', browser.name))
        .value()
      }

      // TODO: we currently always scaffold the plugins file
      // even when headlessly or else it will cause an error when
      // we try to load it and it's not there. We must do this here
      // else initialing the plugins will instantly fail.
      if (cfg.pluginsFile) {
        debug('scaffolding with plugins file %s', cfg.pluginsFile)

        return scaffold.plugins(path.dirname(cfg.pluginsFile), cfg)
      }
    })
    .then(callbacks.onOpen)
    .tap(({ cfg, port, warning }) => {
      // if we didnt have a cfg.port
      // then get the port once we
      // open the server
      if (!cfg.port) {
        cfg.port = port

        // and set all the urls again
        _.extend(cfg, config.setUrls(cfg))
      }
    })
    .tap(callbacks.onAfterOpen)
    .then(({ cfg, port, warning }) => {
      // store the cfg from
      // opening the server
      this._cfg = cfg

      debug('project config: %o', _.omit(cfg, 'resolved'))

      if (warning) {
        options.onWarning(warning)
      }

      options.onSavedStateChanged = (state) => this.saveState(state)

      return Bluebird.join(
        this.watchSettingsAndStartWebsockets(options, cfg),
        this.scaffold(cfg),
      )
      .then(() => {
        return Bluebird.join(
          this.checkSupportFile(cfg),
          this.watchPluginsFile(cfg, options),
        )
      })
    })
    .return(this)
  }

  getRuns () {
    return Bluebird.all([
      this.getProjectId(),
      user.ensureAuthToken(),
    ])
    .spread((projectId, authToken) => {
      return api.getProjectRuns(projectId, authToken)
    })
  }

  reset () {
    debug('resetting project instance %s', this.projectRoot)

    this.spec = null
    this.browser = null

    return Bluebird.try(() => {
      if (this._automation) {
        this._automation.reset()
      }

      if (this._server) {
        return this._server.reset()
      }
    })
  }

  close (options?: CloseOptions) {
    debug('closing project instance %s', this.projectRoot)

    this.spec = null
    this.browser = null

    return Bluebird.join(
      this.server?.close(),
      this.watchers?.close(),
      options?.onClose(),
    )
    .then(() => {
      process.chdir(localCwd)
    })
  }

  checkSupportFile (cfg) {
    const supportFile = cfg.supportFile

    if (supportFile) {
      return fs.pathExists(supportFile)
      .then((found) => {
        if (!found) {
          errors.throw('SUPPORT_FILE_NOT_FOUND', supportFile, settings.configFile(cfg))
        }
      })
    }
  }

  watchPluginsFile (cfg, options) {
    debug(`attempt watch plugins file: ${cfg.pluginsFile}`)
    if (!cfg.pluginsFile || options.isTextTerminal) {
      return Bluebird.resolve()
    }

    return fs.pathExists(cfg.pluginsFile)
    .then((found) => {
      debug(`plugins file found? ${found}`)
      // ignore if not found. plugins#init will throw the right error
      if (!found) {
        return
      }

      debug('watch plugins file')

      return this.watchers.watchTree(cfg.pluginsFile, {
        onChange: () => {
          // TODO: completely re-open project instead?
          debug('plugins file changed')

          // re-init plugins after a change
          this._initPlugins(cfg, options)
          .catch((err) => {
            options.onError(err)
          })
        },
      })
    })
  }

  watchSettings (onSettingsChanged, options) {
    // bail if we havent been told to
    // watch anything (like in run mode)
    if (!onSettingsChanged) {
      return
    }

    debug('watch settings files')

    const obj = {
      onChange: () => {
        // dont fire change events if we generated
        // a project id less than 1 second ago
        if (this.generatedProjectIdTimestamp &&
          ((Date.now() - this.generatedProjectIdTimestamp) < 1000)) {
          return
        }

        // call our callback function
        // when settings change!
        onSettingsChanged.call(this)
      },
    }

    if (options.configFile !== false) {
      this.watchers.watch(settings.pathToConfigFile(this.projectRoot, options), obj)
    }

    return this.watchers.watch(settings.pathToCypressEnvJson(this.projectRoot), obj)
  }

  watchSettingsAndStartWebsockets (options: Record<string, unknown> = {}, cfg: Record<string, unknown> = {}) {
    this.watchSettings(options.onSettingsChanged, options)

    const { projectRoot } = cfg
    let { reporter } = cfg as { reporter: RunnablesStore }

    // if we've passed down reporter
    // then record these via mocha reporter
    if (cfg.report) {
      try {
        Reporter.loadReporter(reporter, projectRoot)
      } catch (err) {
        const paths = Reporter.getSearchPathsForReporter(reporter, projectRoot)

        // only include the message if this is the standard MODULE_NOT_FOUND
        // else include the whole stack
        const errorMsg = err.code === 'MODULE_NOT_FOUND' ? err.message : err.stack

        errors.throw('INVALID_REPORTER_NAME', {
          paths,
          error: errorMsg,
          name: reporter,
        })
      }

      reporter = Reporter.create(reporter, cfg.reporterOptions, projectRoot)
    }

    this._automation = new Automation(cfg.namespace, cfg.socketIoCookie, cfg.screenshotsFolder)

    this.server.startWebsockets(this.automation, cfg, {
      onReloadBrowser: options.onReloadBrowser,

      onFocusTests: options.onFocusTests,

      onSpecChanged: options.onSpecChanged,

      onSavedStateChanged: options.onSavedStateChanged,

      onCaptureVideoFrames: (data) => {
        // TODO: move this to browser automation middleware
        this.emit('capture:video:frames', data)
      },

      onConnect: (id) => {
        this.emit('socket:connected', id)
      },

      onTestsReceivedAndMaybeRecord: async (runnables, cb) => {
        debug('received runnables %o', runnables)

        if (reporter != null) {
          reporter.setRunnables(runnables)
        }

        if (this._recordTests) {
          await this._recordTests(runnables, cb)

          this._recordTests = null

          return
        }

        cb()
      },

      onMocha: (event, runnable) => {
        debug('onMocha', event)
        // bail if we dont have a
        // reporter instance
        if (!reporter) {
          return
        }

        reporter.emit(event, runnable)

        if (event === 'end') {
          return Bluebird.all([
            (reporter != null ? reporter.end() : undefined),
            this.server.end(),
          ])
          .spread((stats = {}) => {
            this.emit('end', stats)
          })
        }
      },
    })
  }

  changeToUrl (url) {
    this.server.changeToUrl(url)
  }

  setCurrentSpecAndBrowser (spec, browser: Cypress.Browser) {
    this.spec = spec
    this.browser = browser
  }

  getCurrentSpecAndBrowser () {
    return {
      spec: this.spec,
      browser: this.browser,
    }
  }

  setBrowsers (browsers = []) {
    debug('getting config before setting browsers %o', browsers)

    return this.getConfig()
    .then((cfg) => {
      debug('setting config browsers to %o', browsers)

      cfg.browsers = browsers
    })
  }

  getAutomation () {
    return this.automation
  }

  // do not check files again and again - keep previous promise
  // to refresh it - just close and open the project again.
  determineIsNewProject (folder) {
    return scaffold.isNewProject(folder)
  }

  // returns project config (user settings + defaults + cypress.json)
  // with additional object "state" which are transient things like
  // window width and height, DevTools open or not, etc.
  getConfig (options = {}): Bluebird<Cfg> {
    if (options == null) {
      options = this.options
    }

    if (this._cfg) {
      debug('project has config %o', this._cfg)

      return Bluebird.resolve(this._cfg)
    }

    const setNewProject = (cfg) => {
      if (cfg.isTextTerminal) {
        return
      }

      // decide if new project by asking scaffold
      // and looking at previously saved user state
      if (!cfg.integrationFolder) {
        throw new Error('Missing integration folder')
      }

      return this.determineIsNewProject(cfg.integrationFolder)
      .then((untouchedScaffold) => {
        const userHasSeenOnBoarding = _.get(cfg, 'state.showedOnBoardingModal', false)

        debugScaffold(`untouched scaffold ${untouchedScaffold} modal closed ${userHasSeenOnBoarding}`)
        cfg.isNewProject = untouchedScaffold && !userHasSeenOnBoarding
      })
    }

    return config.get(this.projectRoot, options)
    .then((cfg) => {
      return this._setSavedState(cfg)
    })
    .tap(setNewProject)
  }

  // forces saving of project's state by first merging with argument
  saveState (stateChanges = {}) {
    if (!this.cfg) {
      throw new Error('Missing project config')
    }

    if (!this.projectRoot) {
      throw new Error('Missing project root')
    }

    const newState = _.merge({}, this.cfg.state, stateChanges)

    return savedState.create(this.projectRoot, this.cfg.isTextTerminal)
    .then((state) => state.set(newState))
    .then(() => {
      this.cfg.state = newState

      return newState
    })
  }

  _setSavedState (cfg) {
    debug('get saved state')

    return savedState.create(this.projectRoot, cfg.isTextTerminal)
    .then((state) => state.get())
    .then((state) => {
      cfg.state = state

      return cfg
    })
  }

  getSpecUrl (absoluteSpecPath, specType) {
    debug('get spec url: %s for spec type %s', absoluteSpecPath, specType)

    return this.getConfig()
    .then((cfg) => {
      // if we don't have a absoluteSpecPath or its __all
      if (!absoluteSpecPath || (absoluteSpecPath === '__all')) {
        const url = this.normalizeSpecUrl(cfg.browserUrl, '/__all')

        debug('returning url to run all specs: %s', url)

        return url
      }

      // TODO:
      // to handle both unit + integration tests we need
      // to figure out (based on the config) where this absoluteSpecPath
      // lives. does it live in the integrationFolder or
      // the unit folder?
      // once we determine that we can then prefix it correctly
      // with either integration or unit
      const prefixedPath = this.getPrefixedPathToSpec(cfg, absoluteSpecPath, specType)
      const url = this.normalizeSpecUrl(cfg.browserUrl, prefixedPath)

      debug('return path to spec %o', { specType, absoluteSpecPath, prefixedPath, url })

      return url
    })
  }

  getPrefixedPathToSpec (cfg, pathToSpec, type = 'integration') {
    const { integrationFolder, componentFolder, projectRoot } = cfg

    // for now hard code the 'type' as integration
    // but in the future accept something different here

    // strip out the integration folder and prepend with "/"
    // example:
    //
    // /Users/bmann/Dev/cypress-app/.projects/cypress/integration
    // /Users/bmann/Dev/cypress-app/.projects/cypress/integration/foo.js
    //
    // becomes /integration/foo.js

    const folderToUse = type === 'integration' ? integrationFolder : componentFolder

    const url = `/${path.join(type, path.relative(
      folderToUse,
      path.resolve(projectRoot, pathToSpec),
    ))}`

    debug('prefixed path for spec %o', { pathToSpec, type, url })

    return url
  }

  normalizeSpecUrl (browserUrl, specUrl) {
    const replacer = (match) => match.replace('//', '/')

    return [
      browserUrl,
      '#/tests',
      escapeFilenameInUrl(specUrl),
    ].join('/').replace(multipleForwardSlashesRe, replacer)
  }

  scaffold (cfg: Cfg) {
    debug('scaffolding project %s', this.projectRoot)

    const scaffolds = []

    const push = scaffolds.push.bind(scaffolds)

    // TODO: we are currently always scaffolding support
    // even when headlessly - this is due to a major breaking
    // change of 0.18.0
    // we can later force this not to always happen when most
    // of our users go beyond 0.18.0
    //
    // ensure support dir is created
    // and example support file if dir doesnt exist
    push(scaffold.support(cfg.supportFolder, cfg))

    // if we're in headed mode add these other scaffolding tasks
    debug('scaffold flags %o', {
      isTextTerminal: cfg.isTextTerminal,
      CYPRESS_INTERNAL_FORCE_SCAFFOLD: process.env.CYPRESS_INTERNAL_FORCE_SCAFFOLD,
    })

    const scaffoldExamples = !cfg.isTextTerminal || process.env.CYPRESS_INTERNAL_FORCE_SCAFFOLD

    if (scaffoldExamples) {
      debug('will scaffold integration and fixtures folder')
      push(scaffold.integration(cfg.integrationFolder, cfg))
      push(scaffold.fixture(cfg.fixturesFolder, cfg))
    } else {
      debug('will not scaffold integration or fixtures folder')
    }

    return Bluebird.all(scaffolds)
  }

  writeProjectId (id) {
    const attrs = { projectId: id }

    logger.info('Writing Project ID', _.clone(attrs))

    this.generatedProjectIdTimestamp = new Date()

    return settings
    .write(this.projectRoot, attrs)
    .return(id)
  }

  getProjectId () {
    return this.verifyExistence()
    .then(() => {
      return settings.read(this.projectRoot, this.options)
    })
    .then((readSettings) => {
      if (readSettings && readSettings.projectId) {
        return readSettings.projectId
      }

      errors.throw('NO_PROJECT_ID', settings.configFile(this.options), this.projectRoot)
    })
  }

  verifyExistence () {
    return fs
    .statAsync(this.projectRoot)
    .return(this)
    .catch(() => {
      errors.throw('NO_PROJECT_FOUND_AT_PROJECT_ROOT', this.projectRoot)
    })
  }

  createCiProject (projectDetails) {
    debug('create CI project with projectDetails %o', projectDetails)

    return user.ensureAuthToken()
    .then((authToken) => {
      const remoteOrigin = commitInfo.getRemoteOrigin(this.projectRoot)

      debug('found remote origin at projectRoot %o', {
        remoteOrigin,
        projectRoot: this.projectRoot,
      })

      return remoteOrigin
      .then((remoteOrigin) => {
        return api.createProject(projectDetails, remoteOrigin, authToken)
      })
    }).then((newProject) => {
      return this.writeProjectId(newProject.id)
      .return(newProject)
    })
  }

  getRecordKeys () {
    return Bluebird.all([
      this.getProjectId(),
      user.ensureAuthToken(),
    ])
    .spread((projectId, authToken) => {
      return api.getProjectRecordKeys(projectId, authToken)
    })
  }

  requestAccess (projectId) {
    return user.ensureAuthToken()
    .then((authToken) => {
      return api.requestAccess(projectId, authToken)
    })
  }

  static getOrgs () {
    return user.ensureAuthToken()
    .then((authToken) => {
      return api.getOrgs(authToken)
    })
  }

  static paths () {
    return cache.getProjectRoots()
  }

  static getPathsAndIds () {
    return cache.getProjectRoots()
    // this assumes that the configFile for a cached project is 'cypress.json'
    // https://git.io/JeGyF
    .map((projectRoot) => {
      return Bluebird.props({
        path: projectRoot,
        id: settings.id(projectRoot),
      })
    })
  }

  static getDashboardProjects () {
    return user.ensureAuthToken()
    .then((authToken) => {
      debug('got auth token: %o', { authToken: keys.hide(authToken) })

      return api.getProjects(authToken)
    })
  }

  static _mergeDetails (clientProject, project) {
    return _.extend({}, clientProject, project, { state: 'VALID' })
  }

  static _mergeState (clientProject, state) {
    return _.extend({}, clientProject, { state })
  }

  static _getProject (clientProject, authToken) {
    debug('get project from api', clientProject.id, clientProject.path)

    return api.getProject(clientProject.id, authToken)
    .then((project) => {
      debug('got project from api')

      return ProjectBase._mergeDetails(clientProject, project)
    }).catch((err) => {
      debug('failed to get project from api', err.statusCode)
      switch (err.statusCode) {
        case 404:
          // project doesn't exist
          return ProjectBase._mergeState(clientProject, 'INVALID')
        case 403:
          // project exists, but user isn't authorized for it
          return ProjectBase._mergeState(clientProject, 'UNAUTHORIZED')
        default:
          throw err
      }
    })
  }

  static getProjectStatuses (clientProjects = []) {
    debug(`get project statuses for ${clientProjects.length} projects`)

    return user.ensureAuthToken()
    .then((authToken) => {
      debug('got auth token: %o', { authToken: keys.hide(authToken) })

      return api.getProjects(authToken).then((projects = []) => {
        debug(`got ${projects.length} projects`)
        const projectsIndex = _.keyBy(projects, 'id')

        return Bluebird.all(_.map(clientProjects, (clientProject) => {
          debug('looking at', clientProject.path)
          // not a CI project, just mark as valid and return
          if (!clientProject.id) {
            debug('no project id')

            return ProjectBase._mergeState(clientProject, 'VALID')
          }

          const project = projectsIndex[clientProject.id]

          if (project) {
            debug('found matching:', project)

            // merge in details for matching project
            return ProjectBase._mergeDetails(clientProject, project)
          }

          debug('did not find matching:', project)

          // project has id, but no matching project found
          // check if it doesn't exist or if user isn't authorized
          return ProjectBase._getProject(clientProject, authToken)
        }))
      })
    })
  }

  static getProjectStatus (clientProject) {
    debug('get project status for client id %s at path %s', clientProject.id, clientProject.path)

    if (!clientProject.id) {
      debug('no project id')

      return Bluebird.resolve(ProjectBase._mergeState(clientProject, 'VALID'))
    }

    return user.ensureAuthToken().then((authToken) => {
      debug('got auth token: %o', { authToken: keys.hide(authToken) })

      return ProjectBase._getProject(clientProject, authToken)
    })
  }

  static remove (path) {
    return cache.removeProject(path)
  }

  static add (path, options) {
    // don't cache a project if a non-default configFile is set
    // https://git.io/JeGyF
    if (settings.configFile(options) !== 'cypress.json') {
      return Bluebird.resolve({ path })
    }

    return cache.insertProject(path)
    .then(() => {
      return this.id(path)
    }).then((id) => {
      return { id, path }
    })
    .catch(() => {
      return { path }
    })
  }

  static id (path) {
    return new ProjectBase(path).getProjectId()
  }

  static ensureExists (path, options) {
    // is there a configFile? is the root writable?
    return settings.exists(path, options)
  }

  static config (path) {
    return new ProjectBase(path).getConfig()
  }

  static getSecretKeyByPath (path) {
    // get project id
    return ProjectBase.id(path)
    .then((id) => {
      return user.ensureAuthToken()
      .then((authToken) => {
        return api.getProjectToken(id, authToken)
        .catch(() => {
          errors.throw('CANNOT_FETCH_PROJECT_TOKEN')
        })
      })
    })
  }

  static generateSecretKeyByPath (path) {
    // get project id
    return ProjectBase.id(path)
    .then((id) => {
      return user.ensureAuthToken()
      .then((authToken) => {
        return api.updateProjectToken(id, authToken)
        .catch(() => {
          errors.throw('CANNOT_CREATE_PROJECT_TOKEN')
        })
      })
    })
  }

  // Given a path to the project, finds all specs
  // returns list of specs with respect to the project root
  static findSpecs (projectRoot, specPattern) {
    debug('finding specs for project %s', projectRoot)
    la(check.unemptyString(projectRoot), 'missing project path', projectRoot)
    la(check.maybe.unemptyString(specPattern), 'invalid spec pattern', specPattern)

    // if we have a spec pattern
    if (specPattern) {
      // then normalize to create an absolute
      // file path from projectRoot
      // ie: **/* turns into /Users/bmann/dev/project/**/*
      specPattern = path.resolve(projectRoot, specPattern)
      debug('full spec pattern "%s"', specPattern)
    }

    return new ProjectBase(projectRoot)
    .getConfig()
    // TODO: handle wild card pattern or spec filename
    .then((cfg) => {
      return specsUtil.find(cfg, specPattern)
    }).then(R.prop('integration'))
    .then(R.map(R.prop('name')))
  }
}
