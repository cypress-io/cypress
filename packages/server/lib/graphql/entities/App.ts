import { nxs, NxsResult } from 'nexus-decorators'
import { BaseContext } from '../context/BaseContext'
import { NexusGenTypes } from '../gen/nxs.gen'
import { Project } from './Project'
import { Wizard } from './Wizard'

@nxs.objectType({
  description: 'Namespace for information related to the app',
})
export class App {
  constructor (private ctx: BaseContext) {}

  @nxs.field.nonNull.boolean({
    description: 'Whether this is the first open of the application or not',
  })
  static get isFirstOpen (): NxsResult<'App', 'isFirstOpen'> {
    return true
  }

  @nxs.field.type(() => Wizard, {
    description: 'Metadata about the wizard',
  })
  wizard (args, ctx: NexusGenTypes['context']): NxsResult<'App', 'wizard'> {
    return ctx.wizard
  }

  @nxs.field.nonNull.list.nonNull.type(() => Project, {
    description: 'All known projects for the app',
  })
  get projects (): NxsResult<'App', 'projects'> {
    return this.ctx.projects
  }

  @nxs.field.type(() => Project, {
    description: 'The active project in the app',
  })
  get activeProject (): NxsResult<'App', 'activeProject'> {
    return this.projects.find((p) => p.isOpen) ?? null
  }
}
