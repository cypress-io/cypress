import type { ProjectBase } from '@packages/server/lib/project-base'
import { nxs, NxsResult } from 'nexus-decorators'
import { PluginsStateEnum } from '../constants'
import { Project } from './Project'

@nxs.objectType({
  description: 'A Cypress project is a container',
})
export class LocalProject extends Project {
  private _projectBase?: ProjectBase<any>

  @nxs.field.nonNull.type(() => PluginsStateEnum, {
    description: 'State of plugins file that resolves configuration',
  })
  get plugins (): NxsResult<'Project', 'plugins'> {
    return 'uninitialized'
  }

  /**
   * wraps ProjectBase - wrapper for a project, exposing
   * all manner of internal APIs to configure a project
   * to be launched in a runner
   */
  async initializeProject () {
    this.ctx.actions.initializeProject(this.projectRoot, 'component')
  }

  async initializePlugins () {
    return this.ctx.actions.initializePlugins()
    // ...
  }
}
