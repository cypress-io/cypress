import { nxs, NxsResult } from 'nexus-decorators'
import { Project } from './Project'
import { ResolvedConfig } from './ResolvedConfig'

@nxs.objectType({
  description: 'A Cypress project is a container',
})
export class LocalProject extends Project {
  @nxs.field.type(() => ResolvedConfig)
  resolvedConfig (): NxsResult<'LocalProject', 'resolvedConfig'> {
    const cfg = this.ctx.actions.resolveOpenProjectConfig()

    if (!cfg) {
      throw Error('openProject.getConfig is null. Have you initialized the current project?')
    }

    return new ResolvedConfig(cfg.resolved)
  }
}
