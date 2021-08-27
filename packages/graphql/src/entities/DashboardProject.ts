import { nxs, NxsResult } from 'nexus-decorators'
import type { BaseContext } from '../context/BaseContext'
import { Project } from './Project'
import { RunGroup } from './run'

@nxs.objectType({
  description: 'A Cypress project is a container',
})
export class DashboardProject extends Project {
  constructor (
    projectRoot: string,
    private context: BaseContext,
    private authToken: string,
  ) {
    super(projectRoot, context)
  }

  @nxs.field.list.nonNull.type(() => RunGroup)
  async runs (): Promise<NxsResult<'DashboardProject', 'runs'>> {
    const projectId = await this.projectId()

    if (!projectId) {
      return null
    }

    const result = await this.context.actions.getRuns({
      projectId,
      authToken: this.authToken,
    })

    return result
  }

  @nxs.field.list.nonNull.string()
  async recordKeys (): Promise<NxsResult<'DashboardProject', 'recordKeys'>> {
    const projectId = await this.projectId()

    if (!projectId) {
      return null
    }

    const result = await this.context.actions.getRecordKeys({
      projectId,
      authToken: this.authToken,
    })

    return result
  }
}
