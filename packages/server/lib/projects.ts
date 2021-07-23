import path from 'path'
import browsers from './browsers'
import { Cfg, ProjectBase, Server } from './project-base'
import { NexusGenInputs } from './graphql/gen/nxs.gen'
import { SocketE2E } from './socket-e2e'
import { SocketCt } from '../../server-ct'
import { createRoutes as createE2ERoutes } from './routes'
import { createRoutes as createCTRoutes } from '@packages/server-ct/src/routes-ct'
import { getSpecUrl } from './project_utils'
import origin from './util/origin'
import { Browser } from './browsers/types'

export type TestingType = 'e2e' | 'component'

const spec = {
  name: 'All Specs',
  absolute: '__all',
  relative: '__all',
  specType: 'integration',
} as const

function configureUrls ({
  baseUrl,
  clientRoute,
  namespace,
  xhrRoute,
  reporterRoute,
  port,
}: Pick<Cfg, 'port' | 'baseUrl' | 'clientRoute' | 'namespace' | 'xhrRoute' | 'reporterRoute'>) {
  const proxyUrl = `http://localhost:${port}`
  const rootUrl = baseUrl ? origin(baseUrl) : proxyUrl

  return {
    proxyUrl,
    proxyServer: proxyUrl,
    browserUrl: `${rootUrl}${clientRoute}`,
    reporterUrl: `${rootUrl}${reporterRoute}`,
    xhrUrl: `${namespace}${xhrRoute}`,
  }
}

class Projects {
  currentProjectId?: string
  projects: ProjectBase<Server>[] = []
  currentBrowser?: Browser

  async addProject ({
    projectRoot,
    testingType,
    isCurrent,
  }: NexusGenInputs['AddProjectInput']): Promise<ProjectBase<Server>> {
    const absoluteProjectRoot = path.resolve(projectRoot)

    const exists = this.projects.find((x) => x.projectRoot === absoluteProjectRoot)

    if (exists) {
      return exists
    }

    const type = testingType === 'component' ? 'ct' : 'e2e'

    const projectBase = new ProjectBase({
      projectType: type,
      projectRoot: absoluteProjectRoot,
      options: {
        projectRoot,
        testingType: type,
      },
    })

    const allBrowsers = await browsers.getAllBrowsersWith()

    this.currentProjectId = projectBase.id

    await projectBase.initializeConfig({ browsers: allBrowsers })

    if (isCurrent) {
      this.currentProjectId = projectBase.id
    }

    this.projects.push(projectBase)

    return projectBase
  }

  setBrowser (browser: Browser) {
    this.currentBrowser = browser
  }

  setTestingType (testingType: TestingType) {
    if (!this.openProject) {
      return
    }

    this.openProject.projectType = testingType === 'component' ? 'ct' : 'e2e'
  }

  async initializePlugins () {
    if (!this.openProject) {
      return
    }

    if (this.openProject.pluginsStatus.state === 'initialized') {
      // Do we need to initialize *again*?
      // Consider a `reinitialize` argument to facilitate this.
      return
    }

    try {
      this.openProject.pluginsStatus = { state: 'initializing' }
      const updatedConfig = await this.openProject.initializePlugins(
        this.openProject.getConfig(),
        this.openProject.options,
      )

      this.openProject.__setConfig(updatedConfig)
      this.openProject.pluginsStatus = { state: 'initialized' }
    } catch (e) {
      this.openProject.pluginsStatus = {
        state: 'error',
        message: e.details,
      }
    }
  }

  launchRunner () {
    if (!this.openProject) {
      throw Error('Must set currentProjectId before calling launchRunner!')
    }

    if (!this.currentBrowser) {
      throw Error('Must set currentBrowser before calling launchRunner!')
    }

    let config = this.openProject.getConfig()

    const urls = configureUrls({
      baseUrl: config.baseUrl,
      clientRoute: config.clientRoute,
      namespace: config.namespace,
      xhrRoute: config.xhrRoute,
      reporterRoute: config.reporterRoute,
      port: config.port,
    })

    config = this.openProject.updateConfig(urls)

    const url = getSpecUrl({
      absoluteSpecPath: spec.absolute,
      specType: spec.specType as 'integration' | 'component',
      browserUrl: urls.browserUrl,
      integrationFolder: config.integrationFolder || 'integration',
      componentFolder: config.componentFolder || 'component',
      projectRoot: this.openProject.projectRoot,
    })

    interface LaunchOptions {
      url: string
      browser: Browser
      proxyServer: string
      proxyUrl: string
      socketIoRoute: string
    }

    const options: LaunchOptions = {
      browser: this.currentBrowser,
      url,
      proxyServer: urls.proxyServer,
      proxyUrl: urls.proxyUrl,
      socketIoRoute: config.socketIoRoute!,
    }

    const { socketIoCookie, screenshotsFolder, namespace } = config

    return browsers.open(this.currentBrowser, options, this.openProject.createAutomation({ socketIoCookie, screenshotsFolder, namespace }))
  }

  async closeRunner () {
    if (!this.openProject) {
      return
    }

    await browsers.close()
    this.openProject.reset()
    await this.openProject.close()
  }

  async initializeServer () {
    if (!this.openProject) {
      throw Error('Must set currentProjectId before calling initializeServer!')
    }

    // already listening
    if (this.openProject._server?.listening) {
      return this.openProject
    }

    process.chdir(this.openProject.projectRoot)

    this.openProject.serverStatus = {
      state: 'initializing',
      message: null,
    }

    const server = this.openProject.createServer(this.openProject.projectType)

    this.openProject._server = server

    try {
      // init specs
      const { specsStore } = await this.openProject.initializeSpecStore(this.openProject.getConfig())

      // start server
      const [port] = await server.open(this.openProject.getConfig(), {
        getSpec: () => spec,
        // @ts-ignore
        getCurrentBrowser: () => this.currentBrowser,
        onError: () => {},
        onWarning: () => {},
        shouldCorrelatePreRequests: () => true,
        projectType: this.openProject.projectType,
        SocketCtor: this.openProject.projectType === 'e2e' ? SocketE2E : SocketCt,
        createRoutes: this.openProject.projectType === 'e2e' ? createE2ERoutes : createCTRoutes,
        specsStore,
      })

      const config = this.openProject.getConfig()

      // start websockets
      this.openProject.startWebsockets({
      }, {
        socketIoCookie: config.socketIoCookie,
        namespace: config.namespace,
        screenshotsFolder: config.screenshotsFolder,
        report: config.report,
        reporter: config.reporter,
        reporterOptions: config.reporterOptions,
        projectRoot: this.openProject.projectRoot,
      })

      this.openProject.updateConfig({ port })

      this.openProject.serverStatus = {
        state: 'initialized',
        message: null,
      }
    } catch (e) {
      this.openProject.serverStatus = {
        state: 'error',
        message: e.message,
      }
    }

    return
  }

  get openProject () {
    return this.currentProjectId
      ? this.projects.find((p) => p.id === this.currentProjectId)
      : undefined
  }
}

export const projects = new Projects()
