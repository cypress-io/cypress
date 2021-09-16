import fs from 'fs'
import path from 'path'
import Debug from 'debug'

import type { ServerContext } from './ServerContext'
import { AuthenticatedUser, BaseActions, LocalProject, Viewer } from '@packages/graphql'
import { RunGroup } from '@packages/graphql/src/entities/run'
import { openProject } from '@packages/server/lib/open_project'
import type { LaunchArgs, LaunchOpts, FoundBrowser, OpenProjectLaunchOptions, FullConfig } from '@packages/types'
import { getProjectRoots, insertProject } from '@packages/server/lib/cache'

// @ts-ignore
import user from '@packages/server/lib/user'

// @ts-ignore
import auth from '@packages/server/lib/gui/auth'

// @ts-ignore
import api from '@packages/server/lib/api'

// @ts-ignore
import browsers from '@packages/server/lib/browsers'

import * as config from '@packages/server/lib/config'

import { getId } from '@packages/server/lib/project_static'
import type { BrowserContract } from '../../../graphql/src/contracts/BrowserContract'

const debug = Debug('cypress:server:graphql')

interface RecordKey {
  id: string
  createdAt: string
  lastUsedAt: string
}

/**
 *
 */
export class ServerActions extends BaseActions {
  constructor (protected ctx: ServerContext) {
    super(ctx)
  }

  installDependencies () {
    //
  }

  addProject (projectRoot: string) {
    // no need to re-add
    const found = this.ctx.localProjects.find((x) => x.projectRoot === projectRoot)

    if (found) {
      return found
    }

    const localProject = new LocalProject(projectRoot, this.ctx)

    this.ctx.localProjects.push(localProject)
    insertProject(projectRoot)

    return localProject
  }

  async loadProjects () {
    const cachedProjects = await this._loadProjectsFromCache()

    cachedProjects.forEach((projectRoot) => {
      this.addProject(projectRoot)
    })

    return this.ctx.app.projects
  }

  async _loadProjectsFromCache () {
    return await getProjectRoots()
  }

  async authenticate () {
    const config: AuthenticatedUser = await auth.start(() => {}, 'launchpad')
    const viewer = new Viewer(this.ctx, config)

    this.ctx.viewer = viewer
  }

  async logout () {
    await user.logOut()
    this.ctx.viewer = null
  }

  async getRuns ({ projectId, authToken }: { projectId: string, authToken: string }): Promise<RunGroup[]> {
    const runs = await api.getProjectRuns(projectId, authToken)

    return runs.map((run) => new RunGroup(run))
  }

  async getRecordKeys ({ projectId, authToken }: { projectId: string, authToken: string }): Promise<string[]> {
    const keys: RecordKey[] = await api.getProjectRecordKeys(projectId, authToken)

    return keys.map((x) => x.id)
  }

  async getProjectId (projectRoot: string) {
    const projectId: string = await getId(projectRoot)

    return projectId ?? null
  }

  getBrowsers (): Promise<FoundBrowser[]> {
    return browsers.get()
  }

  initializeConfig (projectRoot: string): Promise<config.FullConfig> {
    return config.get(projectRoot)
  }

  createConfigFile (code: string, configFilename: string): void {
    const project = this.ctx.activeProject

    if (!project) {
      throw Error(`Cannot create config file without activeProject.`)
    }

    fs.writeFileSync(path.resolve(project.projectRoot, configFilename), code)
  }

  async initializeOpenProject (args: LaunchArgs, options: OpenProjectLaunchOptions, browsers: FoundBrowser[]) {
    await openProject.create(args.projectRoot, args, options, browsers)
    if (!this.ctx.activeProject) {
      throw Error('Cannot initialize project without an active project')
    }

    if (args.testingType === 'e2e') {
      this.ctx.activeProject.setE2EPluginsInitialized(true)
    }

    if (args.testingType === 'component') {
      this.ctx.activeProject.setCtPluginsInitialized(true)
    }

    return
  }

  async launchOpenProject (browser: BrowserContract, spec: any, options: LaunchOpts): Promise<void> {
    debug('launching with browser %o', browser)

    return openProject.launch(browser, spec, options)
  }

  resolveOpenProjectConfig (): FullConfig | null {
    return openProject.getConfig() ?? null
  }

  isFirstTime (projectRoot: string, testingType: Cypress.TestingType): boolean {
    try {
      const config = JSON.parse(fs.readFileSync(path.join(projectRoot, 'cypress.json'), 'utf-8'))
      const type = testingType === 'e2e' ? 'e2e' : 'component'
      const overrides = config[type] || {}

      return Object.keys(overrides).length === 0
    } catch (e) {
      const err = e as Error

      // if they do not have a cypress.json, it's definitely their first time using Cypress.
      if (err.name === 'ENOENT') {
        return true
      }

      // unexpected error
      throw Error(e)
    }
  }
}
