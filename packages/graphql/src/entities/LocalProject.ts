import { nxs, NxsResult } from 'nexus-decorators'
import { Project } from './Project'
import { Config } from './Config'

@nxs.objectType({
  description: 'A Cypress project is a container',
})
export class LocalProject extends Project {
  private _config?: Config

  async initialize (): Promise<LocalProject> {
    this._config = await this.ctx.actions.initializeConfig(this.projectRoot)

    return this
  }

  setConfig (config: Config): Config {
    this._config = config

    return this._config
  }

  @nxs.field.type(() => Config)
  get resolvedConfig (): NxsResult<'LocalProject', 'config'> {
    return this._config ?? null
  }
}
