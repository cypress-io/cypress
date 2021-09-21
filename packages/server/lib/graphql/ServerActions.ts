import fs from 'fs'
import path from 'path'
import Debug from 'debug'

import type { ServerContext } from './ServerContext'
import { BaseActions } from '@packages/graphql'
import { openProject } from '@packages/server/lib/open_project'
import type { LaunchArgs, LaunchOpts, FoundBrowser, OpenProjectLaunchOptions, FullConfig } from '@packages/types'
import { ProjectActions } from './ProjectActions'
import { lazy } from '../util/lazyDecorator'

// @ts-ignore
import user from '../user'

// @ts-ignore
import auth from '../gui/auth'

// @ts-ignore
import browsers from '../browsers'

import * as config from '../config'

import { getId } from '../project_static'
import type { BrowserContract } from '../../../graphql/src/contracts/BrowserContract'

const debug = Debug('cypress:server:graphql')

/**
 *
 */
export class ServerActions extends BaseActions {
  constructor (protected ctx: ServerContext) {
    super(ctx)
  }

  @lazy
  get project () {
    return new ProjectActions(this.ctx)
  }

  installDependencies () {
    //
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
