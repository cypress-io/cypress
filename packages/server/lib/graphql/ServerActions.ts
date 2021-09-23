import fs from 'fs'
import path from 'path'

import type { ServerContext } from './ServerContext'
import { openProject } from '@packages/server/lib/open_project'
import type { LaunchArgs, LaunchOpts, FoundBrowser, OpenProjectLaunchOptions, FullConfig } from '@packages/types'
import { getProjectRoots, insertProject } from '@packages/server/lib/cache'

// @ts-ignore
import user from '../user'

// @ts-ignore
import auth from '../gui/auth'

// @ts-ignore
import browsers from '../browsers'

import * as config from '../config'

import { getId } from '../project_static'

/**
 *
 */
export class ServerActions {
  constructor (protected ctx: ServerContext) {}

  installDependencies () {
    //
  }

  async _loadProjectsFromCache () {
    return await getProjectRoots()
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

  resolveOpenProjectConfig (): FullConfig | null {
    return openProject.getConfig() ?? null
  }
}
