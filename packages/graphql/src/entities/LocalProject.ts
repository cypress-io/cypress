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

  @nxs.field.nonNull.boolean({
    description: `Whether the user has configured component testing. Based on the existance of a 'component' key in their cypress.json`,
  })
  hasSetupComponentTesting (): NxsResult<'LocalProject', 'hasSetupComponentTesting'> {
    // default is {}
    // assume if 1 or more key has been configured, CT has been setup
    let config: ReturnType<LocalProject['resolvedConfig']>

    if (!(config = this.resolvedConfig())) {
      return false
    }

    // default is {}
    // assume if 1 or more key has been configured, CT has been setup
    return Object.keys(config.resolvedConfig.component?.value).length > 0 ?? false
  }

  @nxs.field.nonNull.boolean({
    description: `Whether the user has configured e2e testing or not, based on the existance of a 'component' key in their cypress.json`,
  })
  hasSetupE2ETesting (): NxsResult<'LocalProject', 'hasSetupE2ETesting'> {
    let config: ReturnType<LocalProject['resolvedConfig']>

    if (!(config = this.resolvedConfig())) {
      return false
    }

    // default is {}
    // assume if 1 or more key has been configured, E2E has been setup
    return Object.keys(config.resolvedConfig.e2e?.value).length > 0 ?? false
  }
}
