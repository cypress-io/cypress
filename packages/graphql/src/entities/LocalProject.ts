import { nxs, NxsResult } from 'nexus-decorators'
import type { FullConfig } from '@packages/server/lib/config'
import { Project } from './Project'
import { ResolvedConfig } from './ResolvedConfig'

@nxs.objectType({
  description: 'A Cypress project is a container',
})
export class LocalProject extends Project {
  private fullConfig?: FullConfig

  async initialize (): Promise<LocalProject> {
    this.fullConfig = await this.ctx.actions.initializeConfig(this.projectRoot)

    return this
  }

  @nxs.field.type(() => ResolvedConfig)
  resolvedConfig (): NxsResult<'LocalProject', 'resolvedConfig'> {
    if (!this.fullConfig) {
      return null
    }

    return new ResolvedConfig(this.fullConfig.resolved)
  }
}
