import { nxs, NxsResult } from 'nexus-decorators'
import { Project } from './Project'
import { ResolvedConfig } from './ResolvedConfig'

@nxs.objectType({
  description: 'A Cypress project is a container',
})
export class LocalProject extends Project {
  _ctPluginsInitialized: boolean = false
  _e2ePluginsInitialized: boolean = false

  @nxs.field.nonNull.boolean({
    description: 'Whether the user configured this project to use Component Testing',
  })
  get isFirstTimeCT (): NxsResult<'LocalProject', 'isFirstTimeCT'> {
    return this.ctx.actions.isFirstTime(this.projectRoot, 'component')
  }

  @nxs.field.nonNull.boolean({
    description: 'Whether the user configured this project to use e2e Testing',
  })
  get isFirstTimeE2E (): NxsResult<'LocalProject', 'isFirstTimeE2E'> {
    return this.ctx.actions.isFirstTime(this.projectRoot, 'e2e')
  }

  @nxs.field.type(() => ResolvedConfig)
  resolvedConfig (): NxsResult<'LocalProject', 'resolvedConfig'> {
    const cfg = this.ctx.actions.resolveOpenProjectConfig()

    if (!cfg) {
      throw Error('openProject.getConfig is null. Have you initialized the current project?')
    }

    return new ResolvedConfig(cfg.resolved)
  }

  setE2EPluginsInitialized (init: boolean): void {
    this._e2ePluginsInitialized = init
  }

  get e2ePluginsInitialized (): boolean {
    return this._e2ePluginsInitialized
  }

  setCtPluginsInitialized (init: boolean): void {
    this._ctPluginsInitialized = init
  }

  get ctPluginsInitialized (): boolean {
    return this._ctPluginsInitialized
  }
}
