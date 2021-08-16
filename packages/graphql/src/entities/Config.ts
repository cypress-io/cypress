import { nxs, NxsResult } from 'nexus-decorators'
import type { Cfg } from '@packages/server/lib/project-base'

export class Config {
  constructor (private config: Cfg) {}

  @nxs.field.nonNull.string()
  get projectId (): NxsResult<'Config', 'projectId'> | null {
    return this.config.projectId ?? null
  }

  @nxs.field.nonNull.string()
  get projectRoot (): NxsResult<'Config', 'projectRoot'> {
    return this.config.projectRoot
  }
}
