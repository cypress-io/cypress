import fs from 'fs'
import path from 'path'

import type { ServerContext } from './ServerContext'
import { AuthenticatedUser, BaseActions, LocalProject, Viewer } from '@packages/graphql'
import { RunGroup } from '@packages/graphql/src/entities/run'
import { openProject, LaunchArgs, LaunchOpts } from '@packages/server/lib/open_project'

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
import type { FoundBrowser } from '@packages/launcher'
import type { OpenProjectLaunchOptions } from '../project-base'
import type { BrowserContract } from '../../../graphql/src/contracts/BrowserContract'

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

    return localProject
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

  async initializeOpenProject (args: LaunchArgs, options: OpenProjectLaunchOptions) {
    await openProject.create(args.projectRoot, args, options)

    return
  }

  async launchOpenProject (browser: BrowserContract, spec: any, options: LaunchOpts): Promise<void> {
    return openProject.launch(browser, spec, options)
  }

  resolveOpenProjectConfig () {
    return openProject.getConfig() ?? null
  }
}
