import type { NxsMutationArgs } from 'nexus-decorators'
import { ProjectBase } from '../project-base'
import type { ServerContext } from './ServerContext'
import { AuthenticatedUser, BaseActions, LocalProject, TestingType, Viewer } from '@packages/graphql'
import { RunGroup } from '@packages/graphql/src/entities/run'
import type { Browser as TBrowser } from '@packages/server/lib/browsers/types'

// @ts-ignore
import user from '@packages/server/lib/user'

// @ts-ignore
import auth from '@packages/server/lib/gui/auth'

// @ts-ignore
import api from '@packages/server/lib/api'

// @ts-ignore
import browsers from '@packages/server/lib/browsers'

import { getId } from '@packages/server/lib/project_static'

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

  async initializePlugins (project: LocalProject) {
    const cfg = project.projectBase.getConfig()
    const resolvedConfig = await project.projectBase.initializePlugins(cfg)

    return resolvedConfig
  }

  async initializeProject (projectRoot: string, testingType: TestingType, options: any = {}) {
    const base = new ProjectBase({
      projectRoot,
      testingType,
      options,
    })

    if (!this.ctx.app.browserCache) {
      await this.ctx.app.cacheBrowsers()
    }

    await base.initializeConfig(
      // we need to pass browsers - the getting of browsers and
      // config initialization is now decoupled, but the legacy
      // ProjectBase expects browsers to have been globally when
      // #initializeConfig is called.
      // @ts-ignore - something is wrong with types?
      this.ctx.app.browserCache!.map((x) => {
        return {
          name: x.name,
          family: x.family,
          channel: x.channel,
          displayName: x.displayName,
          path: x.path,
          version: x.version,
          majorVersion: x.majorVersion,
          isHeadless: x.isHeadless,
          isHeaded: x.isHeaded,
        }
      }),
    )

    return base
  }

  setActiveProject (projectRoot: string, testingType: TestingType): LocalProject {
    this.ctx.app.setActiveProject(projectRoot)

    return this.ctx.app.activeProject!
  }

  createProjectBase (input: NxsMutationArgs<'addProject'>['input']) {
    return new ProjectBase({
      projectRoot: input.projectRoot,
      testingType: 'component',
      options: {},
    })
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

  getBrowsers (): Promise<TBrowser[]> {
    return browsers.get()
  }
}
