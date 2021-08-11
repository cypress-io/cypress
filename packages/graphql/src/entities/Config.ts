import { nxs, NxsResult } from 'nexus-decorators'
import type { Cfg } from '@packages/server/lib/project-base'

export class Config {
  constructor (private _config: Cfg) {}

  @nxs.field.nonNull.string()
  get projectId (): NxsResult<'Config', 'projectId'> | null {
    return this._config.projectId ?? null
  }
}
