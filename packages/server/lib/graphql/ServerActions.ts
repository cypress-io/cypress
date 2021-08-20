import fs from 'fs'
import path from 'path'
import Debug from 'debug'

import type { ServerContext } from './ServerContext'
import { AuthenticatedUser, BaseActions, Config, LocalProject, Viewer } from '@packages/graphql'
import { RunGroup } from '@packages/graphql/src/entities/run'

// @ts-ignore
import user from '@packages/server/lib/user'

// @ts-ignore
import auth from '@packages/server/lib/gui/auth'

// @ts-ignore
import api from '@packages/server/lib/api'

// @ts-ignore
import plugins from '@packages/server/lib/plugins'

// @ts-ignore
import settings from '@packages/server/lib/util/settings'

// @ts-ignore
import browsers from '@packages/server/lib/browsers'

import * as config from '@packages/server/lib/config'

import { getId } from '@packages/server/lib/project_static'
import { FoundBrowser } from '@packages/launcher'

interface RecordKey {
  id: string
  createdAt: string
  lastUsedAt: string
}

const debug = Debug('cypress:graphql:server-actions')

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

  async initializeConfig (projectRoot: string): Promise<Config> {
    const cfg = await config.get(projectRoot)

    return new Config(cfg)
  }

  createConfigFile (code: string, configFilename: string): void {
    const project = this.ctx.activeProject

    if (!project) {
      throw Error(`Cannot create config file without activeProject.`)
    }

    fs.writeFileSync(path.resolve(project.projectRoot, configFilename), code)
  }

  async initializePlugins (projectRoot: string, projectConfig: Config, browsers) {
    const allowedCfg = config.allowed(projectConfig.rawConfig)

    const modifiedCfg = await plugins.init(allowedCfg, {
      projectRoot,
      configFile: settings.pathToConfigFile(projectRoot, {}),
      testingType: 'component',
      onError: (err: Error) => { /* TODO: do we need this in GraphQL? */ },
      onWarning: () => { /* TODO: do we need this in GraphQL? */ },
    })

    debug('plugin config yielded: %o', modifiedCfg)

    // Need to pass in the browsers for whatever reason
    // TODO: Should't need to do that, at least not here.
    const updatedCfg = config.updateWithPluginValues(
      projectConfig.rawConfig,
      { ... modifiedCfg, browsers },
    )

    debug('updated config yielded: %o', updatedCfg)

    return new Config(updatedCfg)
  }
}
