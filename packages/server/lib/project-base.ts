import { RunnerType, SpecsStore } from "./specs-store"
import config from './config'
import { Automation } from './automation'
import { ServerBase } from "./server-base"
import { getPrefixedPathToSpec, normalizeSpecUrl } from "./project_utils"
import { ServerE2E } from "./server-e2e"
import { ServerCt, SocketCt } from "../../server-ct"
import { SocketE2E } from "./socket-e2e"
import EE from 'events'
import { createRoutes as createE2ERoutes } from './routes'
import { createRoutes as createCTRoutes } from '@packages/server-ct/src/routes-ct'
import plugins from './plugins'
import settings from './util/settings'
import savedState from './saved_state'
import preprocessor from './plugins/preprocessor'
import Watchers from './watchers'
import cwd from './cwd'
import runEvents from './plugins/run_events'
import { fs } from './util/fs'
import Debug from 'debug'
import { RootRunnable} from '@packages/reporter'
import Reporter from './reporter'
import errors from './errors'

// import Bluebird from 'bluebird'
// import check from 'check-more-types'
// import Debug from 'debug'
// import EE from 'events'
// import _ from 'lodash'
// import path from 'path'

// import commitInfo from '@cypress/commit-info'
// import browsers from './browsers'
// import pkg from '@packages/root'
// import { ServerCt, SocketCt } from '@packages/server-ct'
// import { SocketE2E } from './socket-e2e'
// import api from './api'
// import { Automation } from './automation'
// import cache from './cache'
// import cwd from './cwd'
// import errors from './errors'
// import logger from './logger'
// import Reporter from './reporter'
// import runEvents from './plugins/run_events'
// import savedState from './saved_state'
// import scaffold from './scaffold'
// import { ServerE2E } from './server-e2e'
// import system from './util/system'
// import user from './user'
// import { ensureProp } from './util/class-helpers'
// import { escapeFilenameInUrl } from './util/escape_filename'
// import { fs } from './util/fs'
// import keys from './util/keys'
// import settings from './util/settings'
// import plugins from './plugins'
// import specsUtil from './util/specs'
// import Watchers from './watchers'
// import devServer from './plugins/dev-server'
// import preprocessor from './plugins/preprocessor'
// import { SpecsStore } from './specs-store'
// import { createRoutes as createE2ERoutes } from './routes'
// import { createRoutes as createCTRoutes } from '@packages/server-ct/src/routes-ct'

// interface OpenOptions {
//   onOpen: (cfg: any) => Bluebird<any>
// }

// export type Cfg = Record<string, any>

// const localCwd = cwd()
// const multipleForwardSlashesRe = /[^:\/\/](\/{2,})/g
// const backSlashesRe = /\\/g

const debug = Debug('cypress:server:project')
// const debugScaffold = Debug('cypress:server:scaffold')

// export class ProjectBase<TServer extends ServerE2E | ServerCt> extends EE {
//   protected projectRoot: string
//   protected watchers: Watchers
//   protected options?: Record<string, any>
//   protected _cfg?: Cfg
//   protected _server?: TServer
//   protected _automation?: Automation
//   private _recordTests = null

//   public browser: any
//   public projectType?: 'e2e' | 'ct'
//   public spec: Cypress.Cypress['spec'] | null

//   constructor ({ projectRoot, projectType }: { projectRoot: string, projectType: 'ct' | 'e2e' } = {}) {
//     super()

//     if (!projectRoot) {
//       throw new Error('Instantiating lib/project requires a projectRoot!')
//     }

//     if (!check.unemptyString(projectRoot)) {
//       throw new Error(`Expected project root path, not ${projectRoot}`)
//     }

//     this.projectType = projectType
//     this.projectRoot = path.resolve(projectRoot)
//     this.watchers = new Watchers()
//     this.spec = null
//     this.browser = null

//     debug('Project created %o', {
//       projectType: this.projectType,
//       projectRoot: this.projectRoot,
//     })
//   }

//   protected ensureProp = ensureProp

//   setOnTestsReceived (fn) {
//     this._recordTests = fn
//   }

//   get server () {
//     return this.EnsureProp(this._server, 'open')
//   }

//   get automation () {
//     return this.ensureProp(this._automation, 'open')
//   }

//   get cfg () {
//     return this.ensureProp(this._cfg, 'open')
//   }

//   get state () {
//     return this.cfg.state
//   }

//   injectCtSpecificConfig (cfg) {
//     const rawJson = cfg.rawJson as Cfg

//     return {
//       ...cfg,
//       viewportHeight: rawJson.viewportHeight ?? 500,
//       viewportWidth: rawJson.viewportWidth ?? 500,
//     }
//   }

//   onOpen (cfg: Record<string, any> | undefined, options: OpenServerOptions) {
//     this._server = this.projectType === 'e2e'
//       ? new ServerE2E()
//       : new ServerCt()

//     return this._initPlugins(cfg, options)
//     .then(({ cfg, specsStore, startSpecWatcher }) => {
//       const updatedCfg = this.projectType === 'e2e'
//         ? cfg
//         : this.injectCtSpecificConfig(cfg)

//       return this.server.open(updatedCfg, {
//         project: this,
//         onError: options.onError,
//         onWarning: options.onWarning,
//         shouldCorrelatePreRequests: this.shouldCorrelatePreRequests,
//         projectType: this.projectType,
//         SocketCtor: this.projectType === 'e2e' ? SocketE2E : SocketCt,
//         createRoutes: this.projectType === 'e2e' ? createE2ERoutes : createCTRoutes,
//         specsStore,
//       })
//       .then(([port, warning]) => {
//         return {
//           cfg: updatedCfg,
//           port,
//           warning,
//           specsStore,
//           startSpecWatcher,
//         }
//       })
//     })
//   }

//   onAfterOpen ({ cfg }) {
//     cfg.proxyServer = cfg.proxyUrl

//     return cfg
//   }

//   open (options = {}, callbacks: OpenOptions) {
//     debug('opening project instance %s', this.projectRoot)
//     debug('project open options %o', options)

//     _.defaults(options, {
//       report: false,
//       onFocusTests () {},
//       onError () {},
//       onWarning () {},
//       onSettingsChanged: false,
//     })

//     debug('project options %o', options)
//     this.options = options

//     return this.getConfig(options)
//     .tap((cfg) => {
//       process.chdir(this.projectRoot)

//       // attach warning message if user has "chromeWebSecurity: false" for unsupported browser
//       if (cfg.chromeWebSecurity === false) {
//         _.chain(cfg.browsers)
//         .filter((browser) => browser.family !== 'chromium')
//         .each((browser) => browser.warning = errors.getMsgByType('CHROME_WEB_SECURITY_NOT_SUPPORTED', browser.name))
//         .value()
//       }

//       // TODO: we currently always scaffold the plugins file
//       // even when headlessly or else it will cause an error when
//       // we try to load it and it's not there. We must do this here
//       // else initialing the plugins will instantly fail.
//       if (cfg.pluginsFile) {
//         debug('scaffolding with plugins file %s', cfg.pluginsFile)

//         return scaffold.plugins(path.dirname(cfg.pluginsFile), cfg)
//       }
//     })
//     .then((cfg) => {
//       return this.onOpen(cfg, options)
//     })
//     .tap(({ cfg, port }) => {
//       // if we didnt have a cfg.port
//       // then get the port once we
//       // open the server
//       if (!cfg.port) {
//         cfg.port = port

//         // and set all the urls again
//         _.extend(cfg, config.setUrls(cfg))
//       }
//     })
//     .tap(this.onAfterOpen)
//     .then(({ cfg, port, warning, startSpecWatcher, specsStore }) => {
//       // store the cfg from
//       // opening the server
//       this._cfg = cfg

//       debug('project config: %o', _.omit(cfg, 'resolved'))

//       if (warning) {
//         options.onWarning(warning)
//       }

//       options.onSavedStateChanged = (state) => this.saveState(state)

//       // save the last time they opened the project
//       // along with the first time they opened it
//       const now = Date.now()
//       const stateToSave = {
//         lastOpened: now,
//       }

//       if (!cfg.state || !cfg.state.firstOpened) {
//         stateToSave.firstOpened = now
//       }

//       return Bluebird.join(
//         this.watchSettingsAndStartWebsockets(options, cfg),
//         this.scaffold(cfg),
//         this.saveState(stateToSave),
//       )
//       .then(() => {
//         // start watching specs
//         // whenever a spec file is added or removed, we notify the
//         // <SpecList>
//         // This is only used for CT right now, but it will be
//         // used for E2E eventually. Until then, do not watch
//         // the specs.
//         startSpecWatcher()

//         return Bluebird.join(
//           this.checkSupportFile(cfg),
//           this.watchPluginsFile(cfg, options),
//         )
//       })
//       .then(() => {
//         if (cfg.isTextTerminal || !cfg.experimentalInteractiveRunEvents) return

//         return system.info()
//         .then((sys) => {
//           const beforeRunDetails = {
//             config: cfg,
//             cypressVersion: pkg.version,
//             system: _.pick(sys, 'osName', 'osVersion'),
//           }

//           return runEvents.execute('before:run', cfg, beforeRunDetails)
//         })
//       })
//     })
//     .return(this)
//   }

//   getRuns () {
//     return Bluebird.all([
//       this.getProjectId(),
//       user.ensureAuthToken(),
//     ])
//     .spread((projectId, authToken) => {
//       return api.getProjectRuns(projectId, authToken)
//     })
//   }

//   reset () {
//     debug('resetting project instance %s', this.projectRoot)

//     this.spec = null
//     this.browser = null

//     return Bluebird.try(() => {
//       if (this._automation) {
//         this._automation.reset()
//       }

//       if (this._server) {
//         return this._server.reset()
//       }
//     })
//   }

//   close () {
//     debug('closing project instance %s', this.projectRoot)

//     this.spec = null
//     this.browser = null

//     const closePreprocessor = this.projectType === 'e2e' && preprocessor.close ?? undefined

//     return Bluebird.join(
//       this.server?.close(),
//       this.watchers?.close(),
//       closePreprocessor?.(),
//     )
//     .then(() => {
//       process.chdir(localCwd)

//       return this.getConfig()
//     })
//     .then((config) => {
//       if (config.isTextTerminal || !config.experimentalInteractiveRunEvents) return

//       return runEvents.execute('after:run', config)
//     })
//   }

//   checkSupportFile (cfg) {
//     const supportFile = cfg.supportFile

//     if (supportFile) {
//       return fs.pathExists(supportFile)
//       .then((found) => {
//         if (!found) {
//           errors.throw('SUPPORT_FILE_NOT_FOUND', supportFile, settings.configFile(cfg))
//         }
//       })
//     }
//   }

//   _onError<Options extends Record<string, any>> (err: Error, options: Options) {
//     debug('got plugins error', err.stack)

//     browsers.close()

//     options.onError(err)
//   }

//   _initPlugins (cfg, options) {
//     // only init plugins with the
//     // allowed config values to
//     // prevent tampering with the
//     // internals and breaking cypress
//     const allowedCfg = config.allowed(cfg)

//     return plugins.init(allowedCfg, {
//       projectRoot: this.projectRoot,
//       configFile: settings.pathToConfigFile(this.projectRoot, options),
//       testingType: options.testingType,
//       onError: (err: Error) => this._onError(err, options),
//       onWarning: options.onWarning,
//     })
//     .then((modifiedCfg) => {
//       debug('plugin config yielded: %o', modifiedCfg)

//       const updatedConfig = config.updateWithPluginValues(cfg, modifiedCfg)

//       if (this.projectType === 'ct') {
//         updatedConfig.componentTesting = true

//         // This value is normally set up in the `packages/server/lib/plugins/index.js#110`
//         // But if we don't return it in the plugins function, it never gets set
//         // Since there is no chance that it will have any other value here, we set it to "component"
//         // This allows users to not return config in the `cypress/plugins/index.js` file
//         // https://github.com/cypress-io/cypress/issues/16860
//         updatedConfig.resolved.testingType = { value: 'component' }
//       }

//       debug('updated config: %o', updatedConfig)

//       return Bluebird.resolve(updatedConfig)
//     })
//     .then(async (modifiedConfig: any) => {
//       const specs = (await specsUtil.find(modifiedConfig)).filter((spec: Cypress.Cypress['spec']) => {
//         if (this.projectType === 'ct') {
//           return spec.specType === 'component'
//         }

//         if (this.projectType === 'e2e') {
//           return spec.specType === 'integration'
//         }

//         throw Error(`Cannot return specType for projectType: ${this.projectType}`)
//       })

//       return this.initSpecStore({ specs, config: modifiedConfig })
//     })
//   }

//   async startCtDevServer (specs: Cypress.Cypress['spec'][], config: any) {
//     // CT uses a dev-server to build the bundle.
//     // We start the dev server here.
//     const devServerOptions = await devServer.start({ specs, config })

//     if (!devServerOptions) {
//       throw new Error([
//         'It looks like nothing was returned from on(\'dev-server:start\', {here}).',
//         'Make sure that the dev-server:start function returns an object.',
//         'For example: on("dev-server:start", () => startWebpackDevServer({ webpackConfig }))',
//       ].join('\n'))
//     }

//     return { port: devServerOptions.port }
//   }

//   async initSpecStore ({
//     specs,
//     config,
//   }: {
//     specs: Cypress.Cypress['spec'][]
//     config: any
//   }) {
//     const specsStore = new SpecsStore(config, this.projectType)

//     if (this.projectType === 'ct') {
//       const { port } = await this.startCtDevServer(specs, config)

//       config.baseUrl = `http://localhost:${port}`
//     }

//     const startSpecWatcher = () => {
//       return specsStore.watch({
//         onSpecsChanged: (specs) => {
//         // both e2e and CT watch the specs and send them to the
//         // client to be shown in the SpecList.
//           this.server.sendSpecList(specs, this.projectType)

//           if (this.projectType === 'ct') {
//           // ct uses the dev-server to build and bundle the speces.
//           // send new files to dev server
//             devServer.updateSpecs(specs)
//           }
//         },
//       })
//     }

//     return specsStore.storeSpecFiles()
//     .return({
//       specsStore,
//       cfg: config,
//       startSpecWatcher,
//     })
//   }

//   watchPluginsFile (cfg, options) {
//     debug(`attempt watch plugins file: ${cfg.pluginsFile}`)
//     if (!cfg.pluginsFile || options.isTextTerminal) {
//       return Bluebird.resolve()
//     }

//     return fs.pathExists(cfg.pluginsFile)
//     .then((found) => {
//       debug(`plugins file found? ${found}`)
//       // ignore if not found. plugins#init will throw the right error
//       if (!found) {
//         return
//       }

//       debug('watch plugins file')

//       return this.watchers.watchTree(cfg.pluginsFile, {
//         onChange: () => {
//           // TODO: completely re-open project instead?
//           debug('plugins file changed')

//           // re-init plugins after a change
//           this._initPlugins(cfg, options)
//           .catch((err) => {
//             options.onError(err)
//           })
//         },
//       })
//     })
//   }

//   watchSettings (onSettingsChanged, options) {
//     // bail if we havent been told to
//     // watch anything (like in run mode)
//     if (!onSettingsChanged) {
//       return
//     }

//     debug('watch settings files')

//     const obj = {
//       onChange: () => {
//         // dont fire change events if we generated
//         // a project id less than 1 second ago
//         if (this.generatedProjectIdTimestamp &&
//           ((Date.now() - this.generatedProjectIdTimestamp) < 1000)) {
//           return
//         }

//         // call our callback function
//         // when settings change!
//         onSettingsChanged.call(this)
//       },
//     }

//     if (options.configFile !== false) {
//       this.watchers.watch(settings.pathToConfigFile(this.projectRoot, options), obj)
//     }

//     return this.watchers.watch(settings.pathToCypressEnvJson(this.projectRoot), obj)
//   }

//   watchSettingsAndStartWebsockets (options: Record<string, unknown> = {}, cfg: Record<string, unknown> = {}) {
//     this.watchSettings(options.onSettingsChanged, options)

//     const { projectRoot } = cfg
//     let { reporter } = cfg as { reporter: RunnablesStore }

//     // if we've passed down reporter
//     // then record these via mocha reporter
//     if (cfg.report) {
//       try {
//         Reporter.loadReporter(reporter, projectRoot)
//       } catch (err) {
//         const paths = Reporter.getSearchPathsForReporter(reporter, projectRoot)

//         // only include the message if this is the standard MODULE_NOT_FOUND
//         // else include the whole stack
//         const errorMsg = err.code === 'MODULE_NOT_FOUND' ? err.message : err.stack

//         errors.throw('INVALID_REPORTER_NAME', {
//           paths,
//           error: errorMsg,
//           name: reporter,
//         })
//       }

//       reporter = Reporter.create(reporter, cfg.reporterOptions, projectRoot)
//     }

//     const onBrowserPreRequest = (browserPreRequest) => {
//       this.server.addBrowserPreRequest(browserPreRequest)
//     }

//     this._automation = new Automation(cfg.namespace, cfg.socketIoCookie, cfg.screenshotsFolder, onBrowserPreRequest)

//     this.server.startWebsockets(this.automation, cfg, {
//       onReloadBrowser: options.onReloadBrowser,

//       onFocusTests: options.onFocusTests,

//       onSpecChanged: options.onSpecChanged,

//       onSavedStateChanged: options.onSavedStateChanged,

//       onCaptureVideoFrames: (data) => {
//         // TODO: move this to browser automation middleware
//         this.emit('capture:video:frames', data)
//       },

//       onConnect: (id) => {
//         debug('socket:connected')
//         this.emit('socket:connected', id)
//       },

//       onTestsReceivedAndMaybeRecord: async (runnables, cb) => {
//         debug('received runnables %o', runnables)

//         if (reporter != null) {
//           reporter.setRunnables(runnables)
//         }

//         if (this._recordTests) {
//           await this._recordTests(runnables, cb)

//           this._recordTests = null

//           return
//         }

//         cb()
//       },

//       onMocha: (event, runnable) => {
//         debug('onMocha', event)
//         // bail if we dont have a
//         // reporter instance
//         if (!reporter) {
//           return
//         }

//         reporter.emit(event, runnable)

//         if (event === 'end') {
//           return Bluebird.all([
//             (reporter != null ? reporter.end() : undefined),
//             this.server.end(),
//           ])
//           .spread((stats = {}) => {
//             this.emit('end', stats)
//           })
//         }
//       },
//     })
//   }

//   changeToUrl (url) {
//     this.server.changeToUrl(url)
//   }

//   shouldCorrelatePreRequests = () => {
//     if (!this.browser) {
//       return false
//     }

//     const { family, majorVersion } = this.browser

//     return family === 'chromium' || (family === 'firefox' && majorVersion >= 86)
//   }

//   setCurrentSpecAndBrowser (spec, browser: Cypress.Browser) {
//     this.spec = spec
//     this.browser = browser
//   }

//   getCurrentSpecAndBrowser () {
//     return {
//       spec: this.spec,
//       browser: this.browser,
//     }
//   }

//   setBrowsers (browsers = []) {
//     debug('getting config before setting browsers %o', browsers)

//     return this.getConfig()
//     .then((cfg) => {
//       debug('setting config browsers to %o', browsers)

//       cfg.browsers = browsers
//     })
//   }

//   getAutomation () {
//     return this.automation
//   }

//   removeScaffoldedFiles () {
//     if (!this.cfg) {
//       throw new Error('Missing project config')
//     }

//     return scaffold.removeIntegration(this.cfg.integrationFolder, this.cfg)
//   }

//   // do not check files again and again - keep previous promise
//   // to refresh it - just close and open the project again.
//   determineIsNewProject (folder) {
//     return scaffold.isNewProject(folder)
//   }

//   // returns project config (user settings + defaults + cypress.json)
//   // with additional object "state" which are transient things like
//   // window width and height, DevTools open or not, etc.
//   getConfig (options = {}): Bluebird<Cfg> {
//     if (options == null) {
//       options = this.options
//     }

//     if (this._cfg) {
//       debug('project has config %o', this._cfg)

//       return Bluebird.resolve(this._cfg)
//     }

//     const setNewProject = (cfg) => {
//       if (cfg.isTextTerminal) {
//         return
//       }

//       // decide if new project by asking scaffold
//       // and looking at previously saved user state
//       if (!cfg.integrationFolder) {
//         throw new Error('Missing integration folder')
//       }

//       return this.determineIsNewProject(cfg)
//       .then((untouchedScaffold) => {
//         const userHasSeenBanner = _.get(cfg, 'state.showedNewProjectBanner', false)

//         debugScaffold(`untouched scaffold ${untouchedScaffold} banner closed ${userHasSeenBanner}`)
//         cfg.isNewProject = untouchedScaffold && !userHasSeenBanner
//       })
//     }

//     return config.get(this.projectRoot, options)
//     .then((cfg) => {
//       return this._setSavedState(cfg)
//     })
//     .tap(setNewProject)
//   }

//   // forces saving of project's state by first merging with argument
//   saveState (stateChanges = {}) {
//     if (!this.cfg) {
//       throw new Error('Missing project config')
//     }

//     if (!this.projectRoot) {
//       throw new Error('Missing project root')
//     }

//     return savedState.create(this.projectRoot, this.cfg.isTextTerminal)
//     .tap((state) => state.set(stateChanges))
//     .then((state) => state.get())
//     .then((state) => {
//       this.cfg.state = state

//       return state
//     })
//   }

//   _setSavedState (cfg) {
//     debug('get saved state')

//     return savedState.create(this.projectRoot, cfg.isTextTerminal)
//     .then((state) => state.get())
//     .then((state) => {
//       cfg.state = state

//       return cfg
//     })
//   }

//   getSpecUrl (absoluteSpecPath, specType) {
//     debug('get spec url: %s for spec type %s', absoluteSpecPath, specType)

//     return this.getConfig()
//     .then((cfg) => {
//       // if we don't have a absoluteSpecPath or its __all
//       if (!absoluteSpecPath || (absoluteSpecPath === '__all')) {
//         const url = this.normalizeSpecUrl(cfg.browserUrl, '/__all')

//         debug('returning url to run all specs: %s', url)

//         return url
//       }

//       // TODO:
//       // to handle both unit + integration tests we need
//       // to figure out (based on the config) where this absoluteSpecPath
//       // lives. does it live in the integrationFolder or
//       // the unit folder?
//       // once we determine that we can then prefix it correctly
//       // with either integration or unit
//       const prefixedPath = this.getPrefixedPathToSpec(cfg, absoluteSpecPath, specType)
//       const url = this.normalizeSpecUrl(cfg.browserUrl, prefixedPath)

//       debug('return path to spec %o', { specType, absoluteSpecPath, prefixedPath, url })

//       return url
//     })
//   }

//   getPrefixedPathToSpec (cfg, pathToSpec, type = 'integration') {
//     const { integrationFolder, componentFolder, projectRoot } = cfg

//     // for now hard code the 'type' as integration
//     // but in the future accept something different here

//     // strip out the integration folder and prepend with "/"
//     // example:
//     //
//     // /Users/bmann/Dev/cypress-app/.projects/cypress/integration
//     // /Users/bmann/Dev/cypress-app/.projects/cypress/integration/foo.js
//     //
//     // becomes /integration/foo.js

//     const folderToUse = type === 'integration' ? integrationFolder : componentFolder

//     // To avoid having invalid urls from containing backslashes,
//     // we normalize specUrls to posix by replacing backslash by slash
//     // Indeed, path.realtive will return something different on windows
//     // than on posix systems which can lead to problems
//     const url = `/${path.join(type, path.relative(
//       folderToUse,
//       path.resolve(projectRoot, pathToSpec),
//     )).replace(backSlashesRe, '/')}`

//     debug('prefixed path for spec %o', { pathToSpec, type, url })

//     return url
//   }

//   normalizeSpecUrl (browserUrl, specUrl) {
//     const replacer = (match) => match.replace('//', '/')

//     return [
//       browserUrl,
//       '#/tests',
//       escapeFilenameInUrl(specUrl),
//     ].join('/')
//     .replace(multipleForwardSlashesRe, replacer)
//   }

//   scaffold (cfg: Cfg) {
//     debug('scaffolding project %s', this.projectRoot)

//     const scaffolds = []

//     const push = scaffolds.push.bind(scaffolds)

//     // TODO: we are currently always scaffolding support
//     // even when headlessly - this is due to a major breaking
//     // change of 0.18.0
//     // we can later force this not to always happen when most
//     // of our users go beyond 0.18.0
//     //
//     // ensure support dir is created
//     // and example support file if dir doesnt exist
//     push(scaffold.support(cfg.supportFolder, cfg))

//     // if we're in headed mode add these other scaffolding tasks
//     debug('scaffold flags %o', {
//       isTextTerminal: cfg.isTextTerminal,
//       CYPRESS_INTERNAL_FORCE_SCAFFOLD: process.env.CYPRESS_INTERNAL_FORCE_SCAFFOLD,
//     })

//     const scaffoldExamples = !cfg.isTextTerminal || process.env.CYPRESS_INTERNAL_FORCE_SCAFFOLD

//     if (scaffoldExamples) {
//       debug('will scaffold integration and fixtures folder')
//       push(scaffold.integration(cfg.integrationFolder, cfg))
//       push(scaffold.fixture(cfg.fixturesFolder, cfg))
//     } else {
//       debug('will not scaffold integration or fixtures folder')
//     }

//     return Bluebird.all(scaffolds)
//   }

//   writeProjectId (id) {
//     const attrs = { projectId: id }

//     logger.info('Writing Project ID', _.clone(attrs))

//     this.generatedProjectIdTimestamp = new Date()

//     return settings
//     .write(this.projectRoot, attrs)
//     .return(id)
//   }

//   getProjectId () {
//     return this.verifyExistence()
//     .then(() => {
//       return settings.read(this.projectRoot, this.options)
//     })
//     .then((readSettings) => {
//       if (readSettings && readSettings.projectId) {
//         return readSettings.projectId
//       }

//       errors.throw('NO_PROJECT_ID', settings.configFile(this.options), this.projectRoot)
//     })
//   }

//   verifyExistence () {
//     return fs
//     .statAsync(this.projectRoot)
//     .return(this)
//     .catch(() => {
//       errors.throw('NO_PROJECT_FOUND_AT_PROJECT_ROOT', this.projectRoot)
//     })
//   }

//   createCiProject (projectDetails) {
//     debug('create CI project with projectDetails %o', projectDetails)

//     return user.ensureAuthToken()
//     .then((authToken) => {
//       const remoteOrigin = commitInfo.getRemoteOrigin(this.projectRoot)

//       debug('found remote origin at projectRoot %o', {
//         remoteOrigin,
//         projectRoot: this.projectRoot,
//       })

//       return remoteOrigin
//       .then((remoteOrigin) => {
//         return api.createProject(projectDetails, remoteOrigin, authToken)
//       })
//     }).then((newProject) => {
//       return this.writeProjectId(newProject.id)
//       .return(newProject)
//     })
//   }

//   getRecordKeys () {
//     return Bluebird.all([
//       this.getProjectId(),
//       user.ensureAuthToken(),
//     ])
//     .spread((projectId, authToken) => {
//       return api.getProjectRecordKeys(projectId, authToken)
//     })
//   }

//   requestAccess (projectId) {
//     return user.ensureAuthToken()
//     .then((authToken) => {
//       return api.requestAccess(projectId, authToken)
//     })
//   }

//   static getOrgs () {
//     return user.ensureAuthToken()
//     .then((authToken) => {
//       return api.getOrgs(authToken)
//     })
//   }

//   static paths () {
//     return cache.getProjectRoots()
//   }

//   static getPathsAndIds () {
//     return cache.getProjectRoots()
//     // this assumes that the configFile for a cached project is 'cypress.json'
//     // https://git.io/JeGyF
//     .map((projectRoot) => {
//       return Bluebird.props({
//         path: projectRoot,
//         id: settings.id(projectRoot),
//       })
//     })
//   }

//   static getDashboardProjects () {
//     return user.ensureAuthToken()
//     .then((authToken) => {
//       debug('got auth token: %o', { authToken: keys.hide(authToken) })

//       return api.getProjects(authToken)
//     })
//   }

//   static _mergeDetails (clientProject, project) {
//     return _.extend({}, clientProject, project, { state: 'VALID' })
//   }

//   static _mergeState (clientProject, state) {
//     return _.extend({}, clientProject, { state })
//   }

//   static _getProject (clientProject, authToken) {
//     debug('get project from api', clientProject.id, clientProject.path)

//     return api.getProject(clientProject.id, authToken)
//     .then((project) => {
//       debug('got project from api')

//       return ProjectBase._mergeDetails(clientProject, project)
//     }).catch((err) => {
//       debug('failed to get project from api', err.statusCode)
//       switch (err.statusCode) {
//         case 404:
//           // project doesn't exist
//           return ProjectBase._mergeState(clientProject, 'INVALID')
//         case 403:
//           // project exists, but user isn't authorized for it
//           return ProjectBase._mergeState(clientProject, 'UNAUTHORIZED')
//         default:
//           throw err
//       }
//     })
//   }

//   static getProjectStatuses (clientProjects = []) {
//     debug(`get project statuses for ${clientProjects.length} projects`)

//     return user.ensureAuthToken()
//     .then((authToken) => {
//       debug('got auth token: %o', { authToken: keys.hide(authToken) })

//       return api.getProjects(authToken).then((projects = []) => {
//         debug(`got ${projects.length} projects`)
//         const projectsIndex = _.keyBy(projects, 'id')

//         return Bluebird.all(_.map(clientProjects, (clientProject) => {
//           debug('looking at', clientProject.path)
//           // not a CI project, just mark as valid and return
//           if (!clientProject.id) {
//             debug('no project id')

//             return ProjectBase._mergeState(clientProject, 'VALID')
//           }

//           const project = projectsIndex[clientProject.id]

//           if (project) {
//             debug('found matching:', project)

//             // merge in details for matching project
//             return ProjectBase._mergeDetails(clientProject, project)
//           }

//           debug('did not find matching:', project)

//           // project has id, but no matching project found
//           // check if it doesn't exist or if user isn't authorized
//           return ProjectBase._getProject(clientProject, authToken)
//         }))
//       })
//     })
//   }

//   static getProjectStatus (clientProject) {
//     debug('get project status for client id %s at path %s', clientProject.id, clientProject.path)

//     if (!clientProject.id) {
//       debug('no project id')

//       return Bluebird.resolve(ProjectBase._mergeState(clientProject, 'VALID'))
//     }

//     return user.ensureAuthToken().then((authToken) => {
//       debug('got auth token: %o', { authToken: keys.hide(authToken) })

//       return ProjectBase._getProject(clientProject, authToken)
//     })
//   }

//   static remove (path) {
//     return cache.removeProject(path)
//   }

//   static add (path, options) {
//     // don't cache a project if a non-default configFile is set
//     // https://git.io/JeGyF
//     if (settings.configFile(options) !== 'cypress.json') {
//       return Bluebird.resolve({ path })
//     }

//     return cache.insertProject(path)
//     .then(() => {
//       return this.id(path)
//     }).then((id) => {
//       return { id, path }
//     })
//     .catch(() => {
//       return { path }
//     })
//   }

//   static id (path) {
//     return new ProjectBase({ projectRoot: path, projectType: 'e2e' }).getProjectId()
//   }

//   static ensureExists (path, options) {
//     // is there a configFile? is the root writable?
//     return settings.exists(path, options)
//   }

//   static config (path) {
//     return new ProjectBase({ projectRoot: path, projectType: 'e2e' }).getConfig()
//   }
// }


const localCwd = cwd()

export interface Cfg {
  reporter: 'dot' | 'spec' | string

  report: boolean

  // many other keys also exist.
  // if you find one that isn't listed here, please add it.
  [key: string]: any
}

export type TestingType = 'e2e' | 'component'

export interface Opts {
  onError: (error: Error) => void

  // many other keys also exist.
  // if you find one that isn't listed here, please add it.
  [key: string]: any
}

export class ProjectBase extends EE {
  projectType: RunnerType
  projectRoot: string
  /**
   * Initial options passed when launching Cypress
   * It's a large and complex object with lots of useful information.
   */
  options: Opts

  private _config: Cfg | undefined
  /**
   * current spec that is selected
   */
  spec?: Cypress.Cypress['spec']

  /**
   * browser that will be used for the run or interactive session
   */

  browser?: Cypress.Browser

  /**
   * CDP
   */
  _automation?: Automation

  /**
   * current server used to server specs and handle network layer stubs
   */
   _server?: ServerBase<any>

   /**
    * The port the server is opened on.
    */
   _port?: number

  /**
   * Used to watch 
   * - the specs to show in the desktop GUI
   * - plugins file
   * - config file (cypress.json by default)
   * 
   * Must be initialized by calling `initializeWatchers`
   */
  private _watchers?: Watchers

  private _reporter?: typeof Reporter

  constructor({ projectType, projectRoot, options }: { projectType: RunnerType, projectRoot: string, options: Opts }) {
    super()

    this._watchers = new Watchers()
    this.projectType = projectType
    this.projectRoot = projectRoot
    this.options = options
  }

  /**
   * "opens" a project. Basically everything needed to launch the runner.
   */
  async open () {
    if (this.server) {
      throw Error('Server should not exist until #open is called - this should not happen.')
    }

    const { port, warning } = await this.openServer()

    this._config!.port = port
    const urls = config.setUrls(this.config)

    // update ports
    this._config = {
      ...this.config, 
      ...urls,
      proxyServer: urls.proxyUrl,
      port
    }

    this._automation = new Automation(
      this.config.namespace, 
      this.config.socketIoCookie,
      this.config.screenshotsFolder, 
      (browserPreRequest) => {
        this.server!.addBrowserPreRequest(browserPreRequest)
      }
    )

    await this.startWebsockets()
  }

  get port () {
    if (!this._port) {
      throw Error('Open the server by calling #openServer before trying to access the port')
    }

    return this._port
  }

  get watchers () {
    return this._watchers
  }

  get reporter () {
    if (!this._reporter) {
      throw Error('Call initializeReporter first!')
    }
    return this._reporter
  }

  initializeReporter () {
    if (!this.config.report) {
      return
    }

    // if we've passed down reporter
    // then record these via mocha reporter
    try {
      Reporter.loadReporter(this.config.reporter, this.projectRoot)
    } catch (err) {
      const paths = Reporter.getSearchPathsForReporter(this.config.reporter, this.projectRoot)

      // only include the message if this is the standard MODULE_NOT_FOUND
      // else include the whole stack
      const errorMsg = err.code === 'MODULE_NOT_FOUND' ? err.message : err.stack

      errors.throw('INVALID_REPORTER_NAME', {
        paths,
        error: errorMsg,
        name: this.config.reporter,
      })
    }

    this._reporter = Reporter.create(
      this.config.reporter, this.config.reporterOptions, this.projectRoot)
  }

  async startWebsockets () {
    if (!this.server) {
      throw Error('You need a server before starting web sockets!')
    }

    this.server.startWebsockets(this.automation, this.config, {
      onConnect: (id: string) => {
        debug('socket:connected')
        this.emit('socket:connected', id)
      },

      onTestsReceivedAndMaybeRecord: async (runnables: RootRunnable, executeRunnable: () => any) => {
        debug('received runnables %o', runnables)
        this.initializeReporter()

        this.reporter.setRunnables(runnables)

        // if (this._recordTests) {
        //   await this._recordTests(runnables, cb)

        //   this._recordTests = null

        //   return
        // }

        console.log('Executing runnable')
        executeRunnable()
      },

      onReloadBrowser: () => {
        throw Error('TODO onReloadBrowser')
        // options.onReloadBrowser,
      },

      onFocusTests: () => {
        throw Error('TODO onFocusTests')
        // options.onFocusTests,
      },

      onSpecChanged: () => {
        this.options.onSpecChanged?.()
      },

      onSavedStateChanged: () => {
        throw Error('TODO onSavedStateChanged')
      }, // options.onSavedStateChanged,

      onCaptureVideoFrames: (data) => {
        // TODO: move this to browser automation middleware
        this.emit('capture:video:frames', data)
      },

      onMocha: async (event: string, runnable: any) => {
        debug('onMocha', event)
        // bail if we dont have a
        // reporter instance
        if (!this.reporter) {
          return
        }

        this.reporter.emit(event, runnable)

        if (event === 'end') {
          const [stats, _] = await Promise.all([
            this.reporter.end(),
            this.server?.end()
          ])

          this.emit('end', stats || {})
        }
      },
    })
  }

  async initializeWatchers () {
    this._watchers = new Watchers()
  }

  async initializeSaveState ({ 
    isTextTerminal,
    projectRoot, 
  }: { 
    isTextTerminal: boolean,
    projectRoot: string
  }) {
    const state = await savedState.create(projectRoot, isTextTerminal)
    return await state.get()
  }

  async initializePlugins (testingType: TestingType) {
    const allowedCfg = config.allowed(this.config)

    const updatedConfig = await plugins.init(allowedCfg, {
      projectRoot: this.projectRoot,
      configFile: settings.pathToConfigFile(this.projectRoot, this.options),
      testingType: testingType,
      // Do we even need these?
      // onError: (err: Error) => {
      //   throw Error('TODO: Implement plugins error handling.')
      // },
      // onWarning: () => {
      //   throw Error('TODO: Implement plugins warning handling.')
      // }
    })

    return updatedConfig
  }

  // TODO
  shouldCorrelatePreRequests () {
    return false
  }

  async openServer () {
    console.log('Creating Server!')
    const noop = () => false

    this._server = this.projectType === 'e2e'
      ? new ServerE2E()
      : new ServerCt()
    
    // await this.initializePlugins(this.options.testingType)
    
    const [port, warning] = await this._server.open(this.config, {
      project: this,
      onError: this.options?.onError ?? noop,
      onWarning: this.options?.onWarning ?? noop,
      shouldCorrelatePreRequests: this.shouldCorrelatePreRequests,
      projectType: this.projectType,
      SocketCtor: this.projectType === 'e2e' ? SocketE2E : SocketCt,
      createRoutes: this.projectType === 'e2e' ? createE2ERoutes : createCTRoutes,
      specsStore: {} as any,
    })

    return {
      port,
      warning
    }
  }

  get config () {
    if (!this._config) {
      throw Error('Call initializeConfig first!')
    }

    return this._config
  }

  get automation () {
    if (!this._automation) {
      throw Error ('Must initialize _automation before calling ProjectBase#open')
    }

    return this._automation
  }

  get server () {
    return this._server
  }

  getConfig () {
    return this.config
  }

  /**
   * Set config by reading user settings, merging with defaults and configuring urls.
   */
  async initializeConfig () {
    const defaultConfig = await config.get(this.projectRoot, this.options)
    const state = await this.initializeSaveState({ 
      projectRoot: this.projectRoot, 
      isTextTerminal: defaultConfig.isTextTerminal
    })

    this._config = {
      ...defaultConfig,
      ...config.setUrls(defaultConfig),
      state,
    }
  }

  // Does not need to be a method on ProjectBase
  static async getProjectStatus (clientProject) {
    console.warn('TODO#getProjectStatus')
  }

  // Does not need to be a method on ProjectBase
  static async getProjectStatuses (clientProject) {
    console.warn('TODO#getProjectStatuses')
  }

  /**
   * Reset spec and browser. Useful when changing specs via the desktop GUI.
   */
  reset () {
    this.spec = undefined
    this.browser = undefined

    this.automation?.reset()
    this.server?.reset()
  }

  /**
   * Set spec and browser.
   * This is useful for launching a runner, where you want to set both,
   * or closing a runner, where you want to reset both to be undefined.
   */
  setCurrentSpecAndBrowser ({
    spec,
    browser
  }: { 
    spec: Cypress.Cypress['spec'] | undefined, 
    browser: Cypress.Browser | undefined
  }) {
    this.spec = spec
    this.browser = browser
  }

  getCurrentSpecAndBrowser () {
    return {
      spec: this.spec,
      browser: this.browser,
    }
  }


  getSpecUrl (absoluteSpecPath: string, specType: 'integration' | 'component') {
    // if we don't have a absoluteSpecPath or its __all
    if (!absoluteSpecPath || (absoluteSpecPath === '__all')) {
      return normalizeSpecUrl(this.config.browserUrl, '/__all')
    }

    // TODO:
    // to handle both unit + integration tests we need
    // to figure out (based on the config) where this absoluteSpecPath
    // lives. does it live in the integrationFolder or
    // the unit folder?
    // once we determine that we can then prefix it correctly
    // with either integration or unit
    const prefixedPath = getPrefixedPathToSpec({
      integrationFolder: this.config.integrationFolder, 
      componentFolder: this.config.componentFolder, 
      projectRoot: this.projectRoot,
      type: specType,
      pathToSpec: absoluteSpecPath
    })

    return normalizeSpecUrl(this.config.browserUrl, prefixedPath)
  }

  /**
   * Cleans up everything. This is called when we kill the browser,
   * for example when you choose a new spec from the desktop GUI,
   * or you are done with using Cypress for the day.
   * 
   * Many of these things may not *need* to be called,
   * but we call them just in case anyway.
   * TODO: figure out what actually needs to happen, and what can
   * be done in a more sensible location.
   */
  async close () {
    debug('closing everything')

    this.setCurrentSpecAndBrowser({ spec: undefined, browser: undefined })

    const closePreprocessor = (this.projectType === 'e2e' && preprocessor.close) ?? (() => true)

    await Promise.all([
      this.closeServer(),
      this.watchers?.close(),
      closePreprocessor()
    ])

    process.chdir(localCwd)

    if (this.config.isTextTerminal || !this.config.experimentalInteractiveRunEvents) {
      return
    }

    return runEvents.execute('after:run', this.config)
  }

  async closeServer () {
    debug('closing server')

    if (!this.server) {
      return
    }

    await this.server.close()
    this._server = undefined
  }

  /**
   * Watches the plugins file for changes.
   * If it errors out, we catch the error and bubble it back
   * up to the UI via the onError callback.
   * 
   * If there is no error, currently we do not update the UI - the user
   * must click "try again". 
   * TODO: It'd be nice to automatically update the UI
   * so they don't need to click "try again".
   */
  async watchPluginsFile ({
    pluginsFile,
    isTextTerminal,
    onError
  }: {
    pluginsFile: string,
    isTextTerminal: boolean,
    onError: (err: Error) => void
  }): Promise<void> {
    debug(`attempt watch plugins file: ${pluginsFile}`)

    if (!pluginsFile || isTextTerminal) {
      return Promise.resolve()
    }

    const found = await fs.pathExists(pluginsFile)
    debug(`plugins file found? ${found}`)

    if (!found) {
      return
    }

    if (!this.watchers) {
      throw Error('Must call initializeWatchers before watching something!')
    }

    debug('watch plugins file')

    this.watchers.watchTree(pluginsFile, {
      onChange: async () => {
        // TODO: completely re-open project instead?
        debug('plugins file changed')

        try {
          console.log('ERROR handler:', onError)
        // re-init plugins after a change
          const updatedConfig = await this.initializePlugins(
            this.projectType === 'ct' ? 'component' : 'e2e' as TestingType)

        } catch (err) {
          debug('error when executing plugins file', err)
          return onError(err)
        }
      }
    })
  }
}
