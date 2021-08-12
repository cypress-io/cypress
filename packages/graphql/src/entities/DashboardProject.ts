import { nxs, NxsResult } from 'nexus-decorators'
import type { BaseContext } from '../context/BaseContext'
import type { ProjectContract } from '../contracts'
import { Config } from './Config'
import { Project } from './Project'
import type { Viewer } from './Viewer'

@nxs.objectType({
  description: 'Run',
})
export class Run {
  constructor (private config: { id: string }) {}

  @nxs.field.nonNull.string()
  id (): NxsResult<'Run', 'id'> {
    return this.config.id
  }
}

@nxs.objectType({
  description: 'A Cypress project is a container',
})
export class DashboardProject extends Project {
  constructor(
    config: ProjectContract,
    private context: BaseContext, 
    private viewer: Viewer
  ) {
    super({ config: new Config(config) })
  }

  @nxs.field.list.nonNull.type(() => Run)
  async runs (): Promise<NxsResult<'Project', 'run'>> {
    const result = await this.context.actions.getRuns({ 
      projectId: await this.projectId(),
      authToken: this.viewer.authToken
    })
    console.log('total runs', result.length)
    return result
  }
}
