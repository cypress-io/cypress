import path from 'path'
import browsers from './browsers'
import { ProjectBase, Server } from './project-base'
import { NexusGenInputs } from './graphql/gen/nxs.gen'
import { SocketE2E } from './socket-e2e'
import { SocketCt } from '../../server-ct'
import { createRoutes as createE2ERoutes } from './routes'
import { createRoutes as createCTRoutes } from '@packages/server-ct/src/routes-ct'

export type TestingType = 'e2e' | 'component'

class Projects {
  currentProjectId?: string
  projects: ProjectBase<Server>[] = []

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

  async initializeServer () {
    if (!this.openProject) {
      return
    }

    process.chdir(this.openProject.projectRoot)
    const server = this.openProject.createServer(this.openProject.projectType)

    this.openProject._server = server

    const all = await browsers.get()

    const config = this.openProject.getConfig()

    server.open(config, {
      getSpec: () => null,
      getCurrentBrowser: () => all[0],
      onError: () => {},
      onWarning: () => {},
      shouldCorrelatePreRequests: () => true,
      projectType: this.openProject.projectType,
      SocketCtor: this.openProject.projectType === 'e2e' ? SocketE2E : SocketCt,
      createRoutes: this.openProject.projectType === 'e2e' ? createE2ERoutes : createCTRoutes,
      // @ts-ignore
      specsStore: null,
    })
  }

  get openProject () {
    return this.currentProjectId
      ? this.projects.find((p) => p.id === this.currentProjectId)!
      : undefined
  }
}

export const projects = new Projects()
