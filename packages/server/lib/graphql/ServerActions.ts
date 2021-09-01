import fs from 'fs'
import path from 'path'

import type { ServerContext } from './ServerContext'
import { BaseActions, Project } from '@packages/graphql'
import { openProject } from '@packages/server/lib/open_project'
import type { LaunchArgs, LaunchOpts, FoundBrowser, OpenProjectLaunchOptions, FullConfig } from '@packages/types'

// @ts-ignore
import user from '../user'

// @ts-ignore
import auth from '../gui/auth'

// @ts-ignore
import browsers from '../browsers'

import * as config from '../config'

import { getId } from '../project_static'
import type { BrowserContract } from '../../../graphql/src/contracts/BrowserContract'

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

    const localProject = new Project(projectRoot, this.ctx)

    this.ctx.localProjects.push(localProject)

    return localProject
  }

  async authenticate () {
    this.ctx.setAuthenticatedUser(await auth.start(() => {}, 'launchpad'))
  }

  async logout () {
    try {
      await user.logOut()
    } catch {
      //
    }
    this.ctx.setAuthenticatedUser(null)
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
    try {
      await openProject.create(args.projectRoot, args, options)
    } catch {
      //
    }

    return
  }

  async launchOpenProject (browser: BrowserContract, spec: any, options: LaunchOpts): Promise<void> {
    return openProject.launch(browser, spec, options)
  }

  resolveOpenProjectConfig (): FullConfig | null {
    return openProject.getConfig() ?? null
  }
}
