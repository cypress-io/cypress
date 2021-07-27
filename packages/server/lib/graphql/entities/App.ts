import { nxs, NxsResult } from 'nexus-decorators'
import { NexusGenTypes } from '../gen/nxs.gen'
import { Wizard } from './Wizard'

@nxs.objectType({
  description: 'Namespace for information related to the app',
})
export class App {
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
}
