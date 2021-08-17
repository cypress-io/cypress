import type { ProjectBase } from '@packages/server/lib/project-base'
import { nxs, NxsResult } from 'nexus-decorators'
import { PluginsState, PluginsStateEnum } from '../constants'
import { Config } from './Config'
import { Project } from './Project'

@nxs.objectType({
  description: 'A Cypress project is a container',
})
export class LocalProject extends Project {
  private _projectBase?: ProjectBase<any>
  private _pluginsState: PluginsState = 'uninitialized'

  @nxs.field.nonNull.type(() => PluginsStateEnum, {
    description: 'State of plugins file that resolves configuration',
  })
  get plugins (): NxsResult<'Project', 'plugins'> {
    return this._pluginsState
  }

  /**
   * wraps ProjectBase - wrapper for a project, exposing
   * all manner of internal APIs to configure a project
   * to be launched in a runner
   */
  async initializeProject (): Promise<LocalProject> {
    const base = await this.ctx.actions.initializeProject(this.projectRoot, 'component')

    this._projectBase = base

    return this
  }

  async initializePlugins (): Promise<LocalProject> {
    if (!this.ctx.app.browserCache) {
      const browsers = await this.ctx.app.cacheBrowsers()

      return this.ctx.actions.initializePlugins(this, browsers)
    }

    const cfg = await this.ctx.actions.initializePlugins(this, this.ctx.app.browserCache)

    this._pluginsState = 'initialized'
    this.setConfig(new Config(cfg))

    return this
  }

  get projectBase (): ProjectBase<any> {
    if (!this._projectBase) {
      throw Error('Must call #initializeProject before acccessing projectBase')
    }

    return this._projectBase
  }
}
